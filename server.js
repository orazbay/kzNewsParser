var cheerio = require("cheerio");
var mainUrl = "http://stan.kz/all-post/page/";
var async = require('async');
var needle = require('needle');
var csv = require('csv');
var fs = require('fs');

var links = [];
var pages = [2,3,4,5,6,7];

var sentences = [];


//GET LINKS
async.each(
  pages,
  function(page, callback) {
    var url = mainUrl + page + "/";
    needle.get(url, function(err, res) {
      if (err) throw err;
      var $ = cheerio.load(res.body);
      $(".secondary-news-link").each(function() {
        var link = $(this).attr('href');
        links.push(link);
      });
      callback();
    });
  },
  function(err) {
    if (err) throw err;
    console.log(links);

    getPageContent();

  }
);



//GET PAGE CONTENTS
function getPageContent() {
  async.each(
    links,
    function(link, callback1) {
      needle.get(link, function(err1, res) {
        if (err1) throw err1;
        console.log(link);
        var $ = cheerio.load(res.body);
        $(".article-content.f20").children().each(
          function() {
            var text = $(this).text();
            if (text != null && text != "") {
              var sentencesLocal = text.split(".");
              for (sentenceIndex in sentencesLocal) {
                var sentence = sentencesLocal[sentenceIndex].trim();
                if (sentence != null && sentence != "") {
                  sentences.push(sentence.replace(/[^a-z\u0400-\u04FF]/gi, " "));
                }
              }
            }
          }
        )
        callback1();
      });
    },
    function(err2) {
      if (err2) throw err2;
      getUnigrams();
      getBigrams();
      getTrigrams();
    }
  );
}

function getUnigrams() {
  var unigrams=[];
  for (sentenceIndex in sentences) {
    var sentence = sentences[sentenceIndex].split(" ");
    for (wordIndex in sentence) {
      var word = sentence[wordIndex].trim();
      if (word != null && word != "") {
        unigrams.push(word);
      }
    }
  }
  saveToFile("unigrams",unigrams);
}

function getBigrams() {
  var bigrams=[];
  for (sentenceIndex in sentences) {
    var sentence = sentences[sentenceIndex].split(" ");
    var sentenceLength = sentence.length;
    if (sentenceLength >= 2) {
      var i = 0;
      while (i + 2 != sentenceLength) {
        var word1 = sentence[i].trim();
        var word2 = sentence[i + 1].trim();
        if (!isEmptyString(word1) && !isEmptyString(word2)) {
          var bigram = word1 + " " + word2;
          bigrams.push(bigram);
        }
        i++;
      }
    }
  }
  saveToFile("bigrams",bigrams);
}

function getTrigrams() {
  var trigrams = [];
  for (sentenceIndex in sentences) {
    var sentence = sentences[sentenceIndex].split(" ");
    var sentenceLength = sentence.length;
    if (sentenceLength >= 3) {
      var i = 0;
      while (i + 3 != sentenceLength) {
        var word1 = sentence[i].trim();
        var word2 = sentence[i + 1].trim();
        var word3 = sentence[i + 2].trim();
        if (!isEmptyString(word1) && !isEmptyString(word2) && !isEmptyString(word3)) {
          var trigram = word1 + " " + word2 + " " + word3;
          trigrams.push(trigram);
        }
        i++;
      }
    }
  }
  saveToFile("trigrams", trigrams);
}

function saveToFile(fileName, data) {
  data.sort();

  fileName = fileName + ".txt";

  var file = fs.createWriteStream(fileName);
  file.on('error', function(err) {
      if (err) {
        throw err;
      }
   });
  data.forEach(function(item) {
    file.write(item + '\n');
  });
  file.end();
}

function isEmptyString(string) {
  if (string != null && string != "") {
    return false;
  } else {
    return true;
  }
}
