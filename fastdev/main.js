const cheerio = require('cheerio');
const [request] = require('./INPUT/INPUT').startUrls;
const fs = require('fs').promises;
const _ = require('lodash');

const dir = './data';
const pipeAwait = (...fns) => param => fns.reduce(async (result, next) => next(await result), param)

async function fileExists({ dir, isFile }) {
    return new Promise(async (resolve, reject) => {
        try {
            let stat = await fs.stat(dir);
            resolve(isFile ? stat.isFile() : stat.isDirectory());
        } catch (err) {
            resolve(false);
        }
    })
};

const loadData = async ({request}) => {
    let $;
    let body;
    let json;

    let existsCheerioData = await fileExists({ dir: `${dir}/data.html`, isFile: true });
    if (existsCheerioData) {
        let html = await fs.readFile('./data/data.html');
        $ = cheerio.load(html)
        console.log('Loaded Cheerio Data');
    }

    let existsCsvData = await fileExists({ dir: `${dir}/data.csv`, isFile: true });
    if (existsCsvData) {
        body = await fs.readFile('./data/data.csv');
        console.log('Loaded CSV Data');
    }

    let existsJsonData = await fileExists({ dir: `${dir}/data.json`, isFile: true });
    if (existsJsonData) {
        json = await fs.readFile('./data/data.json');
        json = JSON.parse(json);
        console.log('Loaded JSON Data');
    }

    const log = {
        debug: (msg) => {
            console.log('\x1b[36m', 'DEBUG:', '\x1b[0m', msg );
        },
        info: (msg) => {
            console.log('\x1b[32m', 'INFO:', '\x1b[0m', msg );
        },
        error: (msg) => {
            console.log('\x1b[31m', 'ERROR:', '\x1b[0m', msg );
        }
    }

    const enqueueRequest = (request) => {
        log.debug(`Fake enqueuing: ${request.url}`)
    }

    return { request, $, body, json, log, enqueueRequest }
}

const saveDataInFile = async (data) => {
    if (data) {
        await fs.writeFile('./OUTPUT/result.json', JSON.stringify(data, null, 4))
        console.log('\x1b[32m', 'INFO:', '\x1b[0m', `Data Saved Successfully at ./OUTPUT/result.json`)
    } else {
        console.log('\x1b[32m', 'INFO:', '\x1b[0m', `'No data to save'`)
    }   
}


// Copy your handlePageFunction here
// Available props in context { request, $, log, json, body }
const handlePageFunction = async (context) => {
    const { $, request, log, enqueueRequest } = context;
    const { Manufacturer, Brand, Paginated, ExcludedKeyWords } = request.userData;
    const domain = 'http://www.appliancesdirect.co.uk/';

    if (!Paginated) {
        let productsPerPage = 48;
        let totalNumberOfProducts = $("#productListForm div.sr_resultcount p").text().trim().match(/\d+/g).pop();
        let totalNumberOfPages = Math.ceil(totalNumberOfProducts / productsPerPage);

        log.info(`Manufacturer:  ${Manufacturer}  -  Brand:  ${Brand}
            PRODUCTS: ${totalNumberOfProducts}
            PRODUCTS PER PAGE: ${productsPerPage}
            NUMBER OF PAGES: ${totalNumberOfPages}
            CURRENT URL: ${request.url}\n`);

        for (let i = 2; i <= totalNumberOfPages; i++) {
            let nextUrl = request.url + "?pageNumber=" + i;
            log.info(`Enqueing next page:  ${nextUrl}`);
            const nextPageRequest = {
                url: nextUrl,
                userData: {
                    ...request.userData,
                    Paginated: true
                },
            };
            await enqueueRequest(nextPageRequest);
        }
    }

    const productsCards = $("div#products div.OfferBox");
    log.info(`Found ${productsCards.length} products for ${Manufacturer} - ${Brand} : ${request.url}`);
    const products = [];
    $(productsCards).each(async function (idx, item) {
        let productName = $(item).find('h3 a.offerboxtitle').text().trim();
        let productUrlPath = $(item).find('h3 a.offerboxtitle').attr("href");
        let productUrl = `${domain}${productUrlPath}`;

        if (ExcludedKeyWords) {
            let testKeyword = new RegExp(ExcludedKeyWords).test(productName.toUpperCase());
            if (testKeyword) {
                var excludeProduct = {
                    Handled: true,
                    Message: `Product excluded: ${productName}`,
                    Url: productUrl
                }

                products.push(excludeProduct);
            }

        } else {
            let price = $(item).find('span.offerprice').text().trim().replace("£", "");
            let offerImage = null;
            if ($(item).find('img.offerImage').attr("data-original")) {
                offerImage = $(item).find('img.offerImage').attr("data-original").split("?").shift();
            }
            let imageUri = `${domain}${offerImage}`;
            let productId = $(item).find('input[type="checkbox"]').attr("value")
            let ctinCode = productUrlPath.replace("/p/", "").split("/").shift().toUpperCase()

            const product = {
                Manufacturer,
                Brand,
                ProductName: productName,
                Price: price,
                ImageUri: imageUri,
                ProductId: productId,
                ProductUrl: productUrl,
                CTINCode: ctinCode,
            };

            products.push(product);
        }
    });

    return products;
}

pipeAwait(
    loadData,
    handlePageFunction,
    saveDataInFile,
)({ request })
