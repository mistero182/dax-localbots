const fs = require('fs').promises;
const _ = require('lodash');
const dir = './data';
const XLSX = require('xlsx');

const csv = require("csvtojson");



async function rejecthandler(err) {
    console.log(err)
};

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

function innerProp (obj, propPath) {
    propPath = propPath.split('.');
    let PascalCaseProp = propPath;

    if (propPath.length > 1) {
        propPath.shift();
        try {
			for (const [idx, el] of obj.entries()) {
				for (const prop of propPath) {
					obj[idx] = el[prop];
				}
			}

            PascalCaseProp = PascalCaseProp.map((item) => {
                return (item.charAt(0).toUpperCase() + item.slice(1));
            });
            PascalCaseProp = PascalCaseProp.join('');
            
        } catch (err) {
            throw err;
        }
    }
    return { obj: obj, path: PascalCaseProp };
}
exports.nFiles = async ({ dir }) => {
    var files = await fs.readdir(dir).catch(rejecthandler);
    return files
}

exports.readFile = async ({ obj, json, ext }) => {
    let file;

    if (ext) {
        file = `${obj}.${ext}`;
    } else {
        file = `${obj}.js`;
    }

    let exists = await fileExists({ dir: `${dir}/${file}`, isFile: true });
    
    if (!exists) {
        filesThatExists = await fs.readdir(`${dir}`);
        return `Error: ${file} file does not exists, verifiy directory and name of file\n` +
               `Actual files in ./data : \n\n\t${filesThatExists.join('\n\t')}\n`;
    }

    const res = await fs.readFile(`${dir}/${file}`).catch(rejecthandler);
    
    if (json) {
        return JSON.parse(res);
    }
 
    return res;
};

exports.clear = async () => {
    let existsDir = await fileExists({ dir: './output', isFile: false })
    if (existsDir) {
        let files = await this.nFiles({ dir: './output' })
        if (files.length > 0) {
            for (const file of files) {
                await fs.unlink(`./output/${file}`).catch(rejecthandler);
            }
        }
    }

    return `cleared`;
};

exports.load = async ({obj, props, save}) => {
    let objeto = await this.readFile({ obj, json: true });
    if (props) objeto = innerProp(objeto, props);

    if (save) {
        if (props) {
            await fs.writeFile(`./data/${obj}${objeto.path}.js`, JSON.stringify(objeto, null, 4));
        } else {
            await fs.writeFile(`./data/${obj}.js`, JSON.stringify(objeto, null, 4));
        }
    }

    // return objeto;
    return objeto;
};

exports.keys = async ({obj, props, save}) => {
    let objeto = await this.readFile({ obj, json: true });
    if (props) objeto = innerProp(objeto, props);

    return Object.keys(objeto);
};

exports.values = async ({obj, prop, noNull, save}) => {
    let objeto = await this.readFile({ obj, json: true });

    if (noNull) {
        objeto = objeto.filter((ele) => {
            if (Object.prototype.hasOwnProperty.call(ele, prop)) {
                if (ele[prop] != null) {
                    return true;
                }
            }
        })
    }

    objeto = objeto.map((ele) => ele[prop]);

    if (save) {
        await fs.writeFile(`./data/${obj}_values.js`, JSON.stringify(objeto, null, 4));
    }

    return objeto;
};

exports.toArray = async ({obj, prop, noNull, save}) => {
    const objeto = await this.readFile({ obj, json: true });
    const format = prop.split(',') // Must be a string of keys separed by commas, E.g. 'ProductName,Stock,Price,ProductUrl'.
    console.log(format);
    
    let result = objeto.map((item, idx) => {
        let flatted = [];

        format.forEach((prop, idxFlat) => {
            flatted[idxFlat] = Object.prototype.hasOwnProperty.call(item, prop) ? item[prop] : null;
        });

        return flatted;
    });

    if (save) {
        let toPrintResult = JSON.stringify(result, null, 4);
        toPrintResult = toPrintResult.replace(/(?<=\n\s{8}.*)\n/g, '\t\t\t\t');
        toPrintResult = toPrintResult.replace(/(?<=\s{4}\[)\n\s+/g, ' ');
        toPrintResult = toPrintResult.replace(/(?<=\t+)\s+/g, '\t');

        await fs.writeFile(`./data/${obj}_array.js`, toPrintResult);
    }

    return result;
};

exports.removeNulls = async ({obj, prop, noNull, save}) => {
    let objeto = await this.readFile({ obj, json: true });

    result = objeto.filter((ele) => {
        if (Object.prototype.hasOwnProperty.call(ele, prop)) {
            if (ele[prop] != null) {
                return true;
            }
            return false;
        } else {
            return false
        }
    })

    if (save) {
        await fs.writeFile(`./data/${obj}_noNulls.js`, JSON.stringify(result, null, 4));
    }

    return result;
};

exports.flat = async ({ obj, prop, save }) => {
    let objeto = await this.readFile({ obj, json: true });

    if (!prop) throw `Not [prop] setted`

    objeto.forEach((item, idx) => {
        Object.keys(item[prop]).forEach((key) => {
            let propUpper = key.charAt(0).toUpperCase() + key.slice(1);
            objeto[idx][`${prop}${propUpper}`] = objeto[idx][prop][key];
            delete objeto[idx][prop][key]
        })
    })

    if (save) await fs.writeFile(`./data/${obj}_flatted.js`, JSON.stringify(objeto, null, 4));
    return objeto;
}

exports.countBy = async ({ obj, prop, save }) => {
    let objeto = await this.readFile({ obj, json: true });

    if (!prop) throw `Not [prop] setted`
    const res = _.countBy(objeto, prop);

    if (save) await fs.writeFile(`./data/${obj}_counted.js`, JSON.stringify(res, null, 4));
    return res
};

exports.sort = async ({obj, prop, save}) => {
    let objeto = await this.readFile({ obj, json: true });

    let show = objeto.map((item) => {
        return item[prop]
    })
    
    let newCollection = [];
    let maxCharAt;

    
    const chartTotal = objeto.reduce((minor, current) => {
        if (minor[prop].length > current[prop].length) {
            return minor;
        }
        return current;
    }, objeto[0]);
    
    
    for(let i = 0; i < chartTotal[prop].length; i++) {
        while (objeto.length > 0) {

            let charIndex = objeto.reduce((minor, current) => {
                if (minor[prop].charAt(i) > current[prop].charAt(i)) {
                    return current;
                }
                return minor;
            }, objeto[0]);
            
            let toPush = objeto.filter((item, idx) => {
                if (item[prop].charAt(i) === charIndex[prop].charAt(i)) {
                    objeto[idx] = null;
                    return true;
                }
                return false
            });

            let totalChars = toPush.reduce((minor, current) => {
                if (minor[prop].length > current[prop].length) {
                    return minor;
                }
                return current;
            }, toPush[0]);

            objeto = objeto.filter((item) => {
                if (item !== null) return true
            })

            newCollection = newCollection.concat(toPush)
        }
        
        objeto = newCollection;
        newCollection = [];
    }


    if (save) await fs.writeFile(`./data/${obj}_sorted.js`, JSON.stringify(objeto, null, 4));
    
    
    // return objeto;
    return objeto;
};

exports.uniquesBy = async ({ obj, prop, save }) => {
    let objeto = await this.readFile({ obj, json: true });
    let uniques = _.uniqBy(objeto, prop);

	if (save) await fs.writeFile(`./data/${obj}_uniques.js`, JSON.stringify(uniques, null, 4));
    return uniques;
}

exports.toRequestAPIUpdater = async ({ obj, save }) => {
    let objeto = await this.readFile({ obj, json: true });

    var updaterRequest = {startUrls: []}
    updaterRequest.startUrls = objeto.map(el => {
        return {
            url: el.ProductUrl,
            userData: {
                "Manufacturer": el.Manufacturer,
                // "OriginalUrl": el.ProductUrl,
                // "Excluded": false,
                // "OriginalUrl": el.OriginalUrl
            }
        }
    })

    if (save) fs.writeFile(`./data/${obj}_requestAPIUpdater.js`, JSON.stringify(updaterRequest, null, 4));
    return '';
}

exports.especialRequest = async ({ obj, save }) => {
    let objeto = await this.readFile({ obj, json: true });

    var updaterRequest = {startUrls: []}
    updaterRequest.startUrls = objeto.map(el => {
        let newProductUrl = el.ProductUrl;
        // newProductUrl = newProductUrl.replace(/&m=[^&]+|m=[^&]+/, '');
        // newProductUrl = newProductUrl.replace(/&crid=[^&]+|crid=[^&]+/, '');
        // newProductUrl = newProductUrl.replace(/&refinements=[^&]+|refinements=[^&]+/, '');
        [newProductUrl] = newProductUrl.match(/.*dp\/[^\/]+/);

        return {
            url: newProductUrl + '/',
            //uniqueKey: el.ProductId,
            userData: {
                "Manufacturer": el.Manufacturer,
                //"VariantId": el.ProductId,
                // "RetailerProductCode": el.ProductId,
            }
        }
    })

    if (save) fs.writeFile(`./data/${obj}_requestAPIUpdater.js`, JSON.stringify(updaterRequest, null, 4));
    return '';
}

exports.repeatedBy = async ({ obj, prop, save }) => {
    let objeto = await this.readFile({ obj, json: true });
    let uniques = await this.uniquesBy({ obj, prop });

    let repeated = uniques.filter((uniq) => {
        let times = 0;
        for (const el of objeto) {
            if (uniq[prop] === el[prop]) {
                times++
            }
        }
        if (times > 1) return true
    })

	if (save) await fs.writeFile(`./data/${obj}_repeated.js`, JSON.stringify(repeated, null, 4));
    return repeated;
}

exports.setIndex = async ({ obj, clean }) => {
    let objeto = await this.readFile({ obj, json: true });

    objeto = objeto.map((el, index) => { 
        return { ...el, index: index };
    });

    await fs.writeFile(`./data/${obj}WithIndex.js`, JSON.stringify(objeto, null, 4));

    return true;
}

exports.handleds = async ({ obj, clean }) => {
    let objeto = await this.readFile({ obj, json: true });

    handleds = objeto.filter((el) => { return el.hasOwnProperty('Handled') });
    
    if (clean) {
        objeto = objeto.filter((el) => { return !el.hasOwnProperty('Handled') });
        await fs.writeFile(`./data/${obj}.js`, JSON.stringify(objeto, null, 4));
        await fs.writeFile(`./data/${obj}_handleds.js`, JSON.stringify(handleds, null, 4));
    }

    return handleds;
}

exports.calculeSize = async ({ obj, clean }) => {
    let objeto = await this.readFile({ obj, json: true });

    sizeUrls = objeto.filter((el) => { return el.hasOwnProperty('size') });

    if (clean) {
        objeto = objeto.filter((el) => { return !el.hasOwnProperty('size') });
        await fs.writeFile(`./data/${obj}.js`, JSON.stringify(objeto, null, 4));
        await fs.writeFile(`./data/${obj}_sizeRequest.js`, JSON.stringify(sizeUrls, null, 4));
    }

    return sizeUrls;
}

exports.toExcel = async ({ obj }) => {
    let objeto = await this.readFile({ obj, json: true });

    // let headers = _.flatMap(objeto);
    let headers = _.flatMap(objeto, (item) => {
        return Object.keys(item);
    });
    headers = _.uniq(headers);
    console.log(_.uniq(headers));
    
    cells = [];
    objeto.forEach((item, idx) => {
        let newRow = [];

        Object.keys(item).forEach((prop) => {            
            let nCol = headers.indexOf(prop);
            newRow[nCol] = item[prop];
        });
        cells.push(newRow);
    });

    cells.unshift(headers);
    console.log(cells);
    
    var wb = XLSX.utils.book_new();
    var ws_name = "SheetJS";

    /* make worksheet */
    var ws = XLSX.utils.aoa_to_sheet(cells);

    /* Add the worksheet to the workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, 'out.xlsb');
};

exports.csvToJson = async ({ obj }) => {
    let objeto = await this.readFile({ obj, json: false, ext: 'csv' });

    csv({delimiter: ';'})
    .fromFile(`./data/${obj}.csv`)
    .then(async (jsonObj) => {
        await fs.writeFile(`./data/${obj}.json`, JSON.stringify(jsonObj, null, 4));
    })

    return true;
};

exports.specialJoin = async ({ obj1, obj2, prop, save }) => {
    let objeto1 = await this.readFile({ obj: obj1, json: true });
    let objeto2 = await this.readFile({ obj: obj2, json: true });

    let result = [];
    objeto1.forEach((item) => {
        
        if (Object.hasOwnProperty.call(item, 'ProductName')) {
            if (item.ProductName === '') {
                console.log(false)
                const [goodProduct] = objeto2.filter((goodItem) => {
                    if (item.ProductId === goodItem.ProductId) {
                        console.log(true)
                        return true;
                    }
                    return false
                })


                if (typeof goodProduct !== 'undefined') {
                    const toPush = {
                        ProductName: goodProduct.ProductName,
                        GoodUrl: goodProduct.ProductUrl,
                        BadUrl: item.ProductUrl,
                    };

                    result.push(toPush)
                }
            }
        }
    })

    if (save) await fs.writeFile(`./data/specialJoin.js`, JSON.stringify(result, null, 4));
    return result;
};

exports.urlErrorsFromLog = async ({ obj, prop, save }) => {
    let objeto = await this.readFile({ obj: obj, json: false, ext:'txt' });
    objeto = objeto.toString();
    
    let urls = objeto.match(/(?<=ERROR.*"url":")[^"]+/g);
    urls = _.uniq(urls);
    
    let result = [];
    urls.forEach((url) => {
        let input = {
            "url": url,
            "userData": {
                "Manufacturer": "Philips",
            }
        };

        result.push(input);
    });

    if (save) await fs.writeFile(`./data/url_errors.js`, JSON.stringify(result, null, 4));
    return result;
};

exports.missedIn = async ({ obj1, obj2, prop, save }) => {
    let objeto1 = await this.readFile({ obj: obj1, json: true });
    let objeto2 = await this.readFile({ obj: obj2, json: true });

    let missed = objeto1;
    missed = missed.filter((primo) => {
        let isInObj2 = false;

        for (const el of objeto2) {
            //console.log(`${primo[prop]} === ${el[prop]}`)
            if (primo[prop] === el[prop]) {
                isInObj2 = true;
                console.log(true)
            }
        }

        return !isInObj2
    })

    if (save) await fs.writeFile(`./data/missedFrom_${obj1}.js`, JSON.stringify(missed, null, 4));
    return missed;
};

exports.compare = async ({ obj1, obj2, save, compareBy }) => {
    let objeto1 = await this.readFile({ obj: obj1, json: true });
    let objeto2 = await this.readFile({ obj: obj2, json: true });
    let itemsCompared = 0;
	
    var differences = objeto1.filter(el1 => {
        let same = true;

        for (let el2 of objeto2) {
            for (var prop in el1) {
              if (el1[compareBy] === el2[compareBy]) {
                
                    if (!el1.hasOwnProperty('diff')) {
                        itemsCompared += 1;
                        el1['diff'] = {};
                        el1.diff['comparedProps'] = [];
                        el1.diff['differenceIn'] = [];
                    }

                    if (el2.hasOwnProperty(prop)) {
                        el1.diff.comparedProps.push(prop);

                        if (el1[prop] !== el2[prop] && el1[compareBy] === el2[compareBy]) {
                          console.log(`ProductId: ${el1.ProductId} => ${obj1}.${prop}: ${el1[prop]} != ${obj2}.${prop}: ${el2[prop]}`);
                          el1.diff.differenceIn.push(prop);
                          same = false;
                        }
                    }
                }
              }
        }
        //console.log(same)
        return !same
    })

    console.log(`\n${itemsCompared} items compared`);
    if (save) await fs.writeFile(`./data/difference_${obj1}_${obj2}.js`, JSON.stringify(differences, null, 4));
    return differences;
}

exports.schema = async ({ obj, save }) => {
    let objeto = await this.readFile({ obj: obj, json: true });
    var propsItems = objeto.map(item => Object.keys(item));
    console.log(`\n`)
    
    var updaterSchema = [
        'ProductId',
        'Manufacturer',
        'ProductName',
        'ProductUrl',
        'Price',
        'Stock',
        'ImageUri',
        'CTINCode',
        'GTINCode',
        'ASINCode',
        'OtherCode',
        'RatingType',
        'RatingSourceValue',
        'ReviewCount',
        'ReviewLink'];

    badKeys = [];

    propsItems.forEach(iProps => {
        iProps.forEach((prop) => {
            if (!updaterSchema.includes(prop)) {
                if (!badKeys.includes(prop)) {
                    badKeys.push(prop);
                }
            }
        })
    })

    // Mode of slashs of Product Url
    const slashs =  objeto.map((obj) => {
        if (obj.hasOwnProperty('ProductUrl')) {
            return obj.ProductUrl.split('/').length;
        }
        return null;
    })
    let slashsMode = _.countBy(slashs);
    let numSlashs = Object.keys(slashsMode).map((prop) => {
        return { numOfSlash: prop, repeated: slashsMode[prop] }
    });
    numSlashs = _.orderBy(numSlashs, 'repeated', 'desc');
    slashMode = Number(numSlashs[0]['numOfSlash']);

    // Mode of slashs of ImageUri
    const imgSlashs =  objeto.map((obj) => {
        if (obj.hasOwnProperty('ImageUri')) {
            return obj.ImageUri.split('/').length;
        }
        return null;
    })
    let imgSlashsMode = _.countBy(imgSlashs);
    let imgNumSlashs = Object.keys(imgSlashsMode).map((prop) => {
        return { imgNumOfSlash: prop, repeated: imgSlashsMode[prop] }
    });
    imgNumSlashs = _.orderBy(imgNumSlashs, 'repeated', 'desc');
    imgSlashMode = Number(imgNumSlashs[0]['imgNumOfSlash']);
    
    objeto.forEach((item, idx) => {
        for (const prop in item) {

            // PRODUCT ID
            if (prop === 'ProductId') {
                if (typeof item[prop] !== 'string' && item[prop] !== null ) {
                    console.log(`${item['ProductId']}: 'ProductId' value is not String type`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'ProductId' value is not String type`;
                }
            }

            // PRODUCT NAME
            if (prop === 'ProductName') {
                if (typeof item[prop] !== 'string' || item[prop] === null ) {
                    console.log(`${item['ProductId']}: 'ProductName' value is not String type`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'ProductName' value is not String type`;
                }
            }

            // MANUFACTURER
            if (prop === 'Manufacturer') {
                if (typeof item[prop] !== 'string' || item[prop] === null ) {
                    console.log(`${item['ProductId']}: 'Manufacturer' value is not String type`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'Manufacturer' value is not String type`;
                }
            }

            // STOCK
            if (prop === 'Stock') {
                if (!item[prop].match('OutOfStock|InStock') && item[prop] !== null ) {
                    console.log(`${item['ProductId']}: 'Stock' value not match 'OutOfStock/InStock'`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'Stock' value not match 'OutOfStock / InStock' schema`;
                }
            }

            // PRICE
            if (prop === 'Price') {
                if (typeof item[prop] !== 'number' && item[prop] !== null ) {
                    console.log(`${item['ProductId']}: 'Price' is not a Number type`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'Price' is not Number type`;
                }
            }

            // PRODUCT URL
            if (prop === 'ProductUrl') {
                if (item[prop].split('/').length !== slashMode) {
                    console.log(`${item['ProductId']}: 'ProductUrl' has a number of '/' different than most`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'ProductUrl' has a number of '/' different than most`;
                }
            }
            
            // IMAGE URI
            if (prop === 'ImageUri') {
                if (item[prop].split('/').length !== imgSlashMode) {
                    console.log(`${item['ProductId']}: 'ImageUri' has a number of '/' different than most`);
                    if (!objeto[idx].hasOwnProperty('schemaErr')) objeto[idx]['schemaErr'] = {};
                    objeto[idx]['schemaErr'][prop] = `'ImageUri' has a number of '/' different than most`;
                }
            }
        }
    })
    
    const toPrint = {
        badKeys: badKeys,
        badSchema: objeto.filter((obj) => obj.hasOwnProperty('schemaErr')),
    }
    if (save) await fs.writeFile(`./data/${obj}_schemaVerification.js`, JSON.stringify(toPrint, null, 4));
    return badKeys;
};