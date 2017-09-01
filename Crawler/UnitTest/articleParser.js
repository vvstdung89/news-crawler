var fs = require("fs")
var parser = require("../app/logics/parser")

var article_processor =  {
    "title" : {
        "selector" : ".ArticleDetail h1"
    },
    "content" : {
        "remove" : ".article-relate, .box-taitro",
        "selector" : ".ArticleContent"
    },
    "created_time" : {
        "type": "time",
        "format" : "DD/MM/YYYY HH:mm",
        "replaces" : [ 
            {
                "isExpression" : true,
                "to" : "moment().format('DD/MM/YYYY')",
                "from" : "Hôm nay"
            }, 
            {
                "isExpression" : true,
                "to" : "moment().subtract(1, 'days').format('DD/MM/YYYY')",
                "from" : "Hôm qua"
            }, 
            {
                "isRegx" : true,
                "to" : "$1/$2/$3 $4:$5",
                "from" : "^.*?(\\d{1,2})/(\\d{1,2})/(\\d{4}).*?(\\d{1,2}):(\\d{1,2}).*?$"
            }
        ],
        "skip_text" : false,
        "selector" : ".ArticleDateTime .ArticleDate"
    }
}

var filePath = process.argv[2]
var htmlFile = fs.readFileSync(filePath).toString()

parser.parseArticle(htmlFile, article_processor)