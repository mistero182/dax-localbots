import  Apify  from  'apify';
const { Actor } = Apify;
import { CheerioCrawler, RequestQueue, RequestList, KeyValueStore, log, Dataset, CrawlerExtension, ProxyConfiguration } from  'crawlee';

Actor.main(async () => {
	var  input = await  KeyValueStore.getInput();
	const  requestList = await  RequestList.open(null, input.startUrls)
	const  requestQueue = await  RequestQueue.open();
	// input.initialCookies = [...cookies];
	
	log.setLevel(log.LEVELS.DEBUG);

	async  function  enqueueRequest(request) {
		return  requestQueue.addRequest(request)
	};

	// const requestHandler = async ({ response, request, body, json, $ }) => {
	const  requestHandler = async (context) => {
		// const { $, request, log, enqueueRequest } = context;
		// const { Manufacturer, ProductPage, Brand, CTINRegex, Product, ExcludedKeyWords } = request.userData;

        const product = {}
		await  Dataset.pushData(product);
	}

	// const failedRequestHandler
	const  failedRequestHandler = async ({ request, errorHandler }) => {
		// console.error(error);
	}

	const  preNavigationHooks = [
		async (crawlingContext, requestAsBrowserOptions) => {
			const { request } = crawlingContext;

		}
	]

	const  postNavigationHooks = [
		async (crawlingContext) => {
			const { request, sendRequest } = crawlingContext;
			//requestAsBrowserOptions.forceUrlEncoding = true;
		},
	]

	const  proxyConfiguration = await  Actor.createProxyConfiguration();
	// const proxyConfiguration = await Actor.createProxyConfiguration({
		// groups: ['RESIDENTIAL'],
		// countryCode: 'AR',
	// })

	// Only for version 0.1.23
	// const prepareRequestFunction = async ({ request }) => {
		// // Modify the request as needed
		// request.userData.customData = 'Custom Value';
		// console.log(`Preparing request for ${request.url}`);
	// };

	const  crawler = new  CheerioCrawler({
		requestList,
		requestQueue,
		proxyConfiguration,
		requestHandler,
		// failedRequestHandler,
		preNavigationHooks,
		postNavigationHooks,
		ignoreSslErrors:  true,
		maxConcurrency:  5,
		maxRequestRetries:  3,
		additionalMimeTypes: [
			"application/json",
			"application/javascript",
			// "text/plain",
			// "application/octet-stream"
		]
	})

	// Start the crawler and wait for it to finish
	await  crawler.run();

	if (!Actor.isAtHome()) {
		const  dataset = await  Dataset.open();
		const  mergedDataSet = await  dataset.getData();
		await  KeyValueStore.setValue('RESULTS', mergedDataSet.items);
	}

	log.info("Crawl complete");
});