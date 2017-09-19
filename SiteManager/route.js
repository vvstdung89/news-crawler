require("./app/logics/backend/article")
require("./app/logics/monitor/stat")

exports = module.exports = function (app, router){

	app.use("/", router);

	router.get("/site", require("./app/logics/site").index)
	router.post("/site/add", require("./app/logics/site").add)
	router.post("/site/edit", require("./app/logics/site").edit)
	router.post("/site/remove", require("./app/logics/site").remove)

	router.post("/site/pause", require("./app/logics/site").pause)
	router.post("/site/start", require("./app/logics/site").start)

	router.post("/site/import", require("./app/logics/site").importFile)

	router.get("/site/:siteID/edit_seed", require("./app/logics/views/edit_seed").index)
	router.post("/site/:siteID/edit_seed/update", require("./app/logics/views/edit_seed").update)

	router.get("/site/:siteID/edit_article", require("./app/logics/views/edit_article").index)
	router.post("/site/:siteID/edit_article/update", require("./app/logics/views/edit_article").update)

	router.post("/url/getSeedURLToCrawl", require("./app/logics/backend/url").getSeedURLToCrawl)
	router.post("/url/getArticleURLToCrawl", require("./app/logics/backend/url").getArticleURLToCrawl)


	router.post("/tester/article_pattern", require("./app/logics/tester/api").article_pattern)
	router.post("/tester/article_processor", require("./app/logics/tester/api").article_processor)

	router.all('*', function(req, res) {
  		res.status("404");
  		res.end()
	});

}
