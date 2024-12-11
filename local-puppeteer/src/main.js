// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/).
import { Actor } from 'apify';
import { PuppeteerCrawler, RequestQueue, RequestList, KeyValueStore, log, Dataset, CheerioCrawler, CrawlerExtension, ProxyConfiguration } from 'crawlee';
import { setTimeout } from "node:timers/promises";

Actor.main(async () => {
    
    const input = await KeyValueStore.getInput();
    const requestList = await RequestList.open(null, input.startUrls)
    const requestQueue = await RequestQueue.open();

    log.setLevel(log.LEVELS.DEBUG);

    async function enqueueRequest(request) {
        return requestQueue.addRequest(request);
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const handlePageFunction = async (context) => {
        const { page, $, request, response, log, Apify, cursor } = context;
        const { Manufacturer, Brand, Categorized } = request.userData;


        
        
        await setTimeout(180000); 
    }
    
    const preNavigationHooks = [async ({ request, page }) => {
        const { OriginalUrl } = request.userData;
        // if (OriginalUrl) {
        //     request.url = "https://www.ubaldi.com/";
        // }

    }]

    const proxyConfiguration = await Actor.createProxyConfiguration();
    // const proxyConfiguration = await Actor.createProxyConfiguration({
    //     groups: ['RESIDENTIAL'],
    //     countryCode: 'MX',
    // })

    const crawler = new PuppeteerCrawler({
        requestList,
        requestQueue,
        proxyConfiguration,
        launchContext: {
            // Chrome with stealth should work for most websites.
            // If it doesn't, feel free to remove this.
            useChrome: true,
            // stealth: false,
            // userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0',
            userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            
            launchOptions: {
                headless: false,
                ignoreDefaultArgs: ["--enable-automation"],
                ignoreHTTPSErrors: true,
                args: [
                    `--window-size=1920,1080`,
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--allow-running-insecure-content",
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--mute-audio",
                    "--no-zygote",
                    "--no-xshm",
                    "--window-size=1920,1080",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--enable-webgl",
                    "--ignore-certificate-errors",
                    "--lang=en-US,en;q=0.9",
                    "--password-store=basic",
                    "--disable-gpu-sandbox",
                    "--disable-software-rasterizer",
                    "--disable-background-timer-throttling",
                    "--disable-backgrounding-occluded-windows",
                    "--disable-renderer-backgrounding",
                    "--disable-infobars",
                    "--disable-breakpad",
                    "--disable-canvas-aa",
                    "--disable-2d-canvas-clip-aa",
                    "--disable-gl-drawing-for-tests",
                    "--enable-low-end-device-mode",
                    "--disable-extensions",
                    "--disable-web-security"
                ],
                defaultViewport: {
                    width:1920,
                    height:1080
                },
                

                // Other Puppeteer options
            },
        },
        maxConcurrency: 1,
        maxRequestRetries: 0,
        preNavigationHooks,
        handlePageFunction,
        navigationTimeoutSecs: 1800,
        // handleRequestTimeoutSecs: 180, // Deprecated
        requestHandlerTimeoutSecs: 1800
    });

    log.info('Starting the crawl.');
    await crawler.run();

    if (!Actor.isAtHome()) {
        const dataset = await Dataset.open();
        const mergedDataSet = await dataset.getData();
        await KeyValueStore.setValue('RESULTS', mergedDataSet.items);
    }

    log.info('Crawl finished.');
});
