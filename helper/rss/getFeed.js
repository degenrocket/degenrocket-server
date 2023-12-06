// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const Parser = require("rss-parser");

let parser = new Parser();

const getFeed = async (source) => {
  console.log("Parsing feed");
  if (source && source.name) {
    console.log("Source:", source.name);
  }
  let data = null;
  try {
    data = await parser.parseURL(source.url);
  } catch (err) {
    console.error("error in getFeed function");
    console.error(err);
  }

  // adding custom source name and custom tickers to each item
  data.items.forEach(function (item) {
    item.source = source.name;
    item.category = source.category;
    item.tickers = source.tickers;
  });
  return data;
};

module.exports = getFeed;
