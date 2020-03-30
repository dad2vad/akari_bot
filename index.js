process.env["NTBA_FIX_319"] = 1;
const fetch = require('node-fetch');
//const telegram_key = require('./config');
require('dotenv').config();

var TelegramBot = require('node-telegram-bot-api'),
telegram = new TelegramBot(process.env.MY_KEY, { polling: true }, {webHook: {port: process.env.PORT, host = '0.0.0.0'}});
telegram.setWebHook('https://akariii-bot.herokuapp.com/' + ':443/bot' + process.env.MY_KEY);

//INLINE QUERY
telegram.on("inline_query", (iquery) => {
console.log(iquery.query);

var query = `
query ($id: Int, $page: Int, $search: String) {
  Page (page: $page) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search) {
      id
      coverImage{large}
      trailer{
        id
        site
      }
      title {
        romaji
      }
      staff{
        nodes{
          name{
            first
            last
          }
          staffMedia{
            edges{
              staffRole
            }
          }
        }
      }
      description (asHtml: true)
      startDate{
        year
      }
      episodes
      chapters
      volumes
      season
      type
      format
      status
      duration
      averageScore
      genres
      characters (role: MAIN) {
        edges {
          node {
            id
            name {
              first
              last
            }
          }
          role
          voiceActors {
            id
            name {
              first
              last
            }
          }
        }
      }
    }
  }
}
`;

var variables = {
    search: iquery.query,
    page: 1
};

var url = 'https://graphql.anilist.co',
    options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        })
    };



  fetch(url, options).then(handleResponse)
                   .then(function(data){
                      var arrResults = [];
                      data.data.Page.media.forEach(function(obj){
                        if(obj.startDate.year === null){
                          obj.startDate.year = "Not available";
                        }
                        if(obj.chapters === null){
                          obj.chapters = "-";
                        }
                        if(obj.episodes === null){
                          obj.episodes = "-";
                        }
                      
                        arrResults.push({
                          type: "article",
                          id: obj.id,
                          title: obj.title.romaji + " [" + obj.format + "]",
                          input_message_content: {
                            message_text: "Title: " + obj.title.romaji + "\n" +
                                          obj.coverImage.large + "\n\n" +
                                          "Type: " + obj.type + "\n" +
                                          "Format: " + obj.format + "\n" +
                                          "Episodes: " + obj.episodes + "\n" +
                                          "Chapters: " + obj.chapters + "\n" +
                                          "Status: " + obj.status + "\n" +
                                          "Genre: " + obj.genres[0] + "\n" +
                                          "Year: " + obj.startDate.year + "\n\n" +
                                          obj.description.replace(/(<([^>]+)>)| null|&(lt|gt|quot);/g, '') 
                                          
                          }
                        });
                      });
                      
                      telegram.answerInlineQuery(iquery.id, arrResults);
                   })
                   .catch(handleError);
});




function handleResponse(response) {
    return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
    });
}

function handleData(data, message) {
    //console.log(data);
    console.log(data.data.Media.title.romaji);
    telegram.sendMessage(message.chat.id, data.data.Media.title.romaji);
}

function handleError(error) {
    console.error(error);
}