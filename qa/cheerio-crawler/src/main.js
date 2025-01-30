// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
// import { Actor, utils } from 'apify';
import Apify from 'apify';
import {promises as fs} from 'fs';
const  { Actor } = Apify;
import { writeFile } from 'fs/promises';
import { CheerioCrawler, RequestQueue, RequestList, KeyValueStore, log, Dataset, CrawlerExtension, ProxyConfiguration } from 'crawlee';

Actor.main(async () => {

    var input = await KeyValueStore.getInput();
    const requestList = await RequestList.open(null, input.startUrls)
    const requestQueue = await RequestQueue.open();
    // input.initialCookies = [...cookies];

    log.setLevel(log.LEVELS.DEBUG);

    async function enqueueRequest(request) {
        return requestQueue.addRequest(request)
    };

    // const requestHandler = async ({ response, request, body, json, $ }) => {
    const requestHandler = async (context) => {
        // const { $, request, log, enqueueRequest } = context;
        // const { Manufacturer, ProductPage, Brand, CTINRegex, Product, ExcludedKeyWords } = request.userData;
        // const { $, request, log } = context;
        // const { Brand, Manufacturer, Paginated, CTINRegex, ExcludedKeyWords, ProductPage, Product } = request.userData;
        // const { $, request, log, body, Actor, json } = context;
        // const { Manufacturer, Brand, ProductPage, Paginated, FirstStep, SecondStep, GTINRegex, ThirdStep, AppId, ApiKey} = request.userData;
    
        const { $, request, log, response } = context;
        const { Manufacturer, CTINRegex, Brand, Category, Paginated, ProductPage,Page } = request.userData;

        // let  dataJson;
        // $('script').each( async (idx, script) => {
        //     if ($(script).html().match(/"@type":"Product/)) {
        //         dataJson = JSON.parse($(script).html());
                
                
        //         console.log(dataJson)
        //     }
        // });
    

        const productsPerPage = 50;
        const domain = "https://www.ark-pc.co.jp";
    
        //on the search page, there will be created the product pages from the second one to the last one
        if (!Paginated) {
    
            const totalNumberOfProducts = $('.display').first().text().match(/\d+/g)[0];
            log.debug(`Number of products: ${totalNumberOfProducts} for page ${request.url}`);
            const totalNumberOfPages = Math.ceil(totalNumberOfProducts / productsPerPage);
    
            //enqueue all pages
            for (let i = 1; i < totalNumberOfPages; i++) {
                const nextUrl = `${request.url}&offset=${i*productsPerPage}`;
                log.debug(`Next page: ${nextUrl}`);
                await enqueueRequest({
                    url: nextUrl,
                    userData: { 
                        ...request.userData,
                        Paginated: true
                    },
                });
            }
        }
    
        if (!ProductPage) {
            //get products
            const productsNode = $('.item_listbox');
            const products = [];
        
            $(productsNode).each(async function (index, element) {
                const productURL = `${domain}${$(element).find('a').attr('href')}`
        
                const productId = $(element).find('.modelnum').text().match(/\d+/g).pop();
                const productName = $(element).find('.itemname1').text().trim();
                let price = $(element).find('.price').text().replace(',', '').replace('円', '');
                price = parseFloat(price);

                const stock = $(element).find('.cart-stat').text().includes('SOLD OUT') ? 'OutOfStock' : 'InStock';
                let image = $(element).find('a img').attr('src');
                if (image.includes('dummy')) {
                    image = $(element).find('a img').data('original');
                }
        
                let ctinCode = $(element).find('.itemname1').text().trim().match(/\w{10,}/g);
                if (ctinCode != undefined) {
                    ctinCode = ctinCode[0];
                } else {
                    ctinCode = null;
                }

                if (ctinCode) {
                    const product = {
                        ProductId: productId,
                        Manufacturer,
                        ProductName: productName,
                        ProductUrl: productURL,
                        ImageUri: image.includes('nowprinting') ? '' : image,
                        Price: price,
                        CTINCode: ctinCode,
                        Stock: stock,
                    }
            
                    products.push(product);
                } else {
                    await enqueueRequest({
                        url: productURL,
                        userData: { 
                            ...request.userData,
                            Paginated: true,
                            ProductPage: true,
                        },
                    });
                }
            })
        
            await Dataset.pushData(products);
        }

        if (ProductPage) {
            let ctinCode = null;
            if ($('.modelname')) {
                ctinCode = $('.modelname').text()
            }


            let product = {
                ProductId: request.url.split('/i/').pop().slice(0, -1),
                ProductName: $('[property="og:title"]').attr('content'),
                ProductUrl: request.url,
                Manufacturer: request.userData.Manufacturer,
                ImageUri: $('[property="og:image"]').attr('content'),
                Price: $('.price').first().text().trim().replace(',', '').replace('円', ''),
                Stock: $('.text-warning').text().includes('在庫あり') ? 'InStock' : 'OutOfStock',
                CTINCode: ctinCode ? ctinCode : undefined,
            }

            await Dataset.pushData(product);
        }
        // return product;
        // return productsData;
        // await Dataset.pushData(product);

        // return (results);
        // await Dataset.pushData(product);
    }

    // const failedRequestHandler
    const failedRequestHandler = async ({ request, errorHandler }) => {

        // console.error(error);

    }

    const preNavigationHooks = [
        async (crawlingContext, requestAsBrowserOptions) => {
            const { request } = crawlingContext;
            request.headers = {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en,es;q=0.9,en-AU;q=0.8,fr;q=0.7,es-ES;q=0.6",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                "cookie": "_d2id=65c76297-1312-4c7b-aa48-fbce9248ad23"
            }
    
        }

    ]

    const postNavigationHooks = [
        async (crawlingContext) => {
            const { request, sendRequest } = crawlingContext;
            //requestAsBrowserOptions.forceUrlEncoding = true;
            

        },
    ]

    
    // const proxyConfiguration = await Actor.createProxyConfiguration();
    const proxyConfiguration = await Actor.createProxyConfiguration({
        groups: ['RESIDENTIAL'],
        countryCode: 'JP',
        // countryCode: 'MX',
    })

    // Only for version 0.1.23
    // const prepareRequestFunction = async ({ request }) => {
    //   // Modify the request as needed
    //   request.userData.customData = 'Custom Value';
    //   console.log(`Preparing request for ${request.url}`);
    // };

    // Create the crawler and add the queue with our URL
    // and a request handler to process the page.
    const crawler = new CheerioCrawler({
        requestList,
        requestQueue,
        proxyConfiguration,
        requestHandler,
        // failedRequestHandler,
        preNavigationHooks,
        postNavigationHooks,
        ignoreSslErrors: true,
        maxConcurrency: 5,
        maxRequestRetries: 3,
        
        // additionalMimeTypes:["application/json"],
        additionalMimeTypes: [
            
            "application/json",
            "application/javascript",
          
            // "text/plain",
            // "application/octet-stream"
            
        ]
    })

    // Start the crawler and wait for it to finish
    await crawler.run();

    if (!Actor.isAtHome()) {
        const dataset = await Dataset.open();
        const mergedDataSet = await dataset.getData();
        await KeyValueStore.setValue('RESULTS', mergedDataSet.items);
    }

    log.info("Crawl complete");

});