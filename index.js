const dotenv = require("dotenv");
const { fetchLikeAxios } = require("./fetchLikeAxios");

dotenv.config();

const LEETCODE_BASE_URL = "https://leetcode.com/";
const LEETCODE_ALL_QUESTION_URL = `${LEETCODE_BASE_URL}api/problems/all/`;
const LEETCODE_RECOMMENDED_LIST_URL = `${LEETCODE_BASE_URL}list/api/get_list/xo2bgr0r/`;

// difficulty defaults to "Medium"
const { SLACK_WEBHOOK_URL, DIFFICULTY = 2 } = process.env;

// the response returns difficulty as levels 1(easy), 2(medium), 3(hard)
const DIFFICULTIES = ["", "Easy", "Medium", "Hard"];

// Main function
(async () => {
  try {
    /** @type {RecommendedResponse} */
    const { questions } = await getData(LEETCODE_RECOMMENDED_LIST_URL);
    const ids = generateListIds(questions);

    /** @type {AllResponse} */
    const allData = await getData(LEETCODE_ALL_QUESTION_URL);

    const freeQuestions = getFreeQuestions(allData);

    // we have to match the IDs from the previous API to ones from the "get all" which contains the
    // actual question information (links, difficuly, etc)
    const recommended = getListQuestions(allData, ids);

    const { difficulty: d, stat } = pickQuestion([...freeQuestions, ...recommended]);
    const text = formatText(
      stat.frontend_question_id,
      stat.question__title,
      stat.question__title_slug,
      DIFFICULTIES[d.level]
    );

    postQuestion(text);
  } catch (error) {
    console.log(error);
  }
})();

/**
 *
 * @param {string} url
 * @template A
 * @returns {Promise<A>}
 */
async function getData(url) {
  const response = await fetchLikeAxios(url);
  const data = await response.json();
  return data;
}

/**
 *
 * @param {AllResponse} data
 * @returns {StatPair[]}
 */
function getFreeQuestions(data) {
  return data.stat_status_pairs.filter(
    ({ difficulty, paid_only }) => difficulty.level <= DIFFICULTY && !paid_only
  );
}

/**
 *
 * @param {Question[]} data
 * @returns {Set<number>}
 */
function generateListIds(data) {
  const ids = new Set();
  data.forEach(({ id }) => {
    ids.add(id);
  });
  return ids;
}

/**
 *
 * @param {AllResponse} data
 * @param {Set<number>} ids
 * @returns {StatPair[]}
 */
function getListQuestions(data, ids) {
  return data.stat_status_pairs.filter(({ stat }) => ids.has(stat.frontend_question_id));
}

// Pick a qestion to post
/**
 *
 * @param {StatPair[]} data
 * @returns {StatPair}
 */
function pickQuestion(data) {
  const i = Math.floor(Math.random() * data.length);
  return data[i];
}

/**
 *
 * @param {number} num
 * @param {string} title
 * @param {string} dir
 * @param {string} difficulty
 * @returns
 */
function formatText(num, title, dir, difficulty) {
  const link = `${LEETCODE_BASE_URL}problems/${dir}/`;
  return `${num}. ${title} - ${difficulty}\n${link}`;
}

/**
 * Post the generated message to Slack
 * @param {string} text
 */
async function postQuestion(text) {
  if (SLACK_WEBHOOK_URL) {
    const response = await fetchLikeAxios(SLACK_WEBHOOK_URL, {
      method: "post",
      body: JSON.stringify({ text }),
    });
    console.info(response.status, text);
  } else {
    console.error("the SLACK_WEBHOOK_URL environment is not set ");
  }
}

/**
 * @typedef {object} RecommendedResponse
 * @property {string} id_hash
 * @property {string} name
 * @property {string} description
 * @property {Question[]} questions
 * @property {boolean} is_public_favorite
 * @property {number} view_count
 * @property {string} creator
 * @property {string} current_user
 * @property {boolean} is_watched
 *
 */

/**
 * @typedef {object} Question
 * @property {number} id
 * @property {string} title
 * @property {string} title_slug
 */

/**
 * @typedef {object} AllResponse
 * @property {Stat[]} stat_status_pairs
 */

/**
 * @typedef {object} StatPair
 * @property {object} stat
 * @property {number} stat.question_id
 * @property {boolean} stat.question__article__live
 * @property {string} stat.question__article__slug
 * @property {boolean} stat.question__article__has_video_solution
 * @property {string} stat.question__title
 * @property {string} stat.question__title_slug
 * @property {boolean} stat.question__hide
 * @property {number} stat.total_acs
 * @property {number} stat.total_submitted
 * @property {number} stat.frontend_question_id
 * @property {boolean} stat.is_new_question
 * @property {object} difficulty
 * @property { number } difficulty.level
 * @property {boolean} paid_only
 * @property {boolean} is_favor
 * @property {number} frequency
 * @property {number} progress
 */
