const cheerio = require('cheerio');
const { Console } = require('console');
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

    return { request, $, body, json }
}

const saveDataInFile = async (data) => {
    if (data) {
        await fs.writeFile('./OUTPUT/result.json', JSON.stringify(data, null, 4))
        log.info(`Data Saved Successfully at ./OUTPUT/result.json`)
    } else {
        log.error('No data to save')
    }
    
}

const handlePageFunction = async ({ request, $, json, body }) => {
    
    // const { $, request, log, response } = context;

    // if (response.status == 404) {
    

    // let jsonListSche = $('#__PRELOADED_STATE__').html();
    // const jsonList = JSON.parse(jsonListSche);

    // const pageState = jsonList.pageState.initialState.results;

    //     for (const item of pageState) {
    //         if (item.polycard && item.polycard.metadata && item.polycard.metadata.url) {
    //             let productUrl = `https://${item.polycard.metadata.url.replace(/\\u002F/g, '/')}`;
    //             if (item.polycard.metadata.url_params && item.polycard.metadata.url_params.match(/pdp_filters=official_store/)) {
    //                 productUrl += item.polycard.metadata.url_params;
    //             }

    //             console.log(productUrl)
    //         }
    //     }


    // const { $, request, log, response} = context;
    // const { $, request, log, response } = context;
    
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

    console.log(product)

    return product;
    
    
    
    // return (results);

    // return result;

}

pipeAwait(
    loadData,
    handlePageFunction,
    saveDataInFile,
)({ request })
