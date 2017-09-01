require("./app/logics/backend/article")

exports = module.exports = function (app, router){

	app.use("/", router);

	router.get("/site", require("./app/logics/site").index)
	router.post("/site/add", require("./app/logics/site").add)
	router.post("/site/edit", require("./app/logics/site").edit)
	router.post("/site/remove", require("./app/logics/site").remove)

	router.post("/site/pause", require("./app/logics/site").pause)
	router.post("/site/start", require("./app/logics/site").start)

	router.post("/site/import", require("./app/logics/site").importFile)


	router.post("/url/getSeedURLToCrawl", require("./app/logics/backend/url").getSeedURLToCrawl)
	router.post("/url/getArticleURLToCrawl", require("./app/logics/backend/url").getArticleURLToCrawl)

	router.all('*', function(req, res) {
  		res.status("404");
  		res.end()
	});

}
