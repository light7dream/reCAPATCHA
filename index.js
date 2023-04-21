const puppeteer = require('puppeteer')
const request = require('request-promise-native')
const poll = require('promise-poller').deafult()

const config = {
    sitekey : '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
    pageurl: 'https://www.google.com/recaptcha/api2/demo',
    apiKey: require('./api-key'),
    apiSubmitUrl: 'http://2captcha.com/in.php',
    apiRetrieveUrl: 'http://2captcha.com/res.php',
}

const getUsername = function(){
    return 'testUser291823928'
}

const getPassword = function(){
    return 'p@ssw0rd21340987'
}

const chromeOptions = {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    slowMo:10,
    defaultViewport: null
}

(async function main(){
    const browser = await puppeteer.launch(chromeOptions)
    const page = await browser.newPage()

    console.log(`Navigating to ${config.pageurl}`)
    await page.goto(config.pageurl)

    const requestId = await initiateCaptchaRequest(config.apiKey)

    // const username = getUsername()
    // console.log(`Typing username ${username}`)
    // await page.type('#user_reg', username);

    // const password = getPassword()
    // console.log(`Typing password ${password}`)
    // await page.type('#password', password);

    const response = await pollForReqeustResults(config.apiKey, requestId)

    console.log(`Entering recaptcha response ${response}`)
    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}"`)

    // console.log(`Submitting...`)
    // page.click('button[type="submit"]')
})()


async function initiateCaptchaRequest(apiKey){
    const formData = {
        method: 'userrecaptcha',
        googlekey: config.sitekey,
        key: apiKey,
        pageurl: config.pageurl,
        json: 1
    }
    console.log(`Submitting solution request to 2captcha for ${config.pageurl}`)
    const response = await request.post(config.apiSubmitUrl, {form: formData})
    return  JSON.parse(response).request;
}

async function pollForReqeustResults(key, id, retries = 30, interval = 1500, delay = 1500){
    console.log(`Waiting for ${delay} milliseconds...`)
    await timeout(delay)

    return poll({
        taskFn: requestCaptchaResults(key, id),
        interval,
        retries
    })
}

function requestCaptchaResults(apiKey, requestId){
    const url = `${config.apiRetrieveUrl}?key=${apiKey}&request=${requestId}&json=1`
    return async function(){
        return new Promise(async function(resolve, reject){
            console.log(`Polling for response...`)
            const rawResponse = await request.get(url)
            const resp = JSON.parse(rawResponse)
            if(resp.status === 0)return reject(resp.request)
            console.log('Response received')
            resolve(resp.request)
        })
    }
}


const timeout = ms => new Promise(res=>setTimeout(res, ms))