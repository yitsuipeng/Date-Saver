require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db,queryPool,intoSql } = require('./db');
const { encodeXText } = require('nodemailer/lib/shared');


router.get('/createSites', async (req, res) => {

    async function sitesInsert(sites) {

        let sql = 'INSERT INTO sites_all (id, name, address, lat, lng, open_time, category, intro) VALUES ?';
        let values = [];
        for(let x of sites){
            let eachValue = [x.id, x.name, x.address, x.nlat, x.elong, x.open_time, JSON.stringify(x.category), x.introduction];
            values.push(eachValue);
        }
        await queryPool(sql,[values]);
        return console.log(values.length);
    }

    async function sitesDelete() {

        let sql = `DELETE FROM sites_all WHERE category LIKE '%宗教%' OR category LIKE '%[{"id":499,"name":"其他"}]%' OR category LIKE '%[{"id":19,"name":"親子共遊"}]%' OR name LIKE '%樂園%';`;
        await queryPool(sql,null);
        console.log('clean');
    }


    for(let i=1; i<=15; i++){
        await axios.get(`https://www.travel.taipei/open-api/zh-tw/Attractions/All?page=${i}`)
        .then(response => {
            let sites = response.data.data; //array
            // let clearSites = sites.filter(result => result.name.indexOf("公園")<0);
            //insert
            sitesInsert(sites);
            
            console.log('finish insert page '+i);
        });
    }
    await sitesDelete();

});

// index
router.get('/getOptionSites', async (req, res) => {

    let sql = `SELECT name, address, lat, lng, category FROM sites_chosen;`;
    // Math.floor(Math.random()*5)+1
    

    queryPool(sql,null)
    .then(result => {

        let optionSites = [];
        for(let x of result){
            let optionObj = {};
            optionObj.title = x.name,
            optionObj.location = {lat: x.lat, lng: x.lng},
            optionObj.category = x.category,
            optionSites.push(optionObj);
        }

        console.log(result.length + ' sites get');
        res.send(optionSites);
    });


});

// main
router.get('/nearCenter/:location', async (req, res) => {

    let show = JSON.parse(req.params.location);
    let lat = show.lat*10000;
    let lng = show.lng*10000;
    let final = { name:"", nlat: 1, elong: 1, distance:10000000000 };
    
    let center = `SELECT * FROM centers;`;
    let centerResult = await queryPool(center,null);

    await centerResult.forEach(element => {
       if ( Math.pow(element.lat*10000-lat, 2) + Math.pow(element.lng*10000-lng, 2) < final.distance ){
           final.name = element.name;
           final.nlat = element.lat;
           final.elong = element.lng;
           final.distance = Math.pow(element.lat*10000-lat, 2) + Math.pow(element.lng*10000-lng, 2);
       }
    });

    let near = `SELECT name, lat, lng, category, place_id FROM sites_chosen;`;
    let nearResult = await queryPool(near,null);
    await nearResult.sort((a, b) => {
        return (Math.pow(a.lat*10000-lat, 2) + Math.pow(a.lng*10000-lng, 2)) - (Math.pow(b.lat*10000-lat, 2) + Math.pow(b.lng*10000-lng, 2));
    });

    // let food = `SELECT name, lat, lng FROM restaurants WHERE center = '${final.name}'`;
    // let foodResult = await queryPool(food,null);
    // await foodResult.sort((a, b) => {
    //     return (Math.pow(a.nlat*10000-final.nlat*10000, 2) + Math.pow(a.elong*10000-final.elong*10000, 2)) - (Math.pow(b.nlat*10000-final.nlat*10000, 2) + Math.pow(b.elong*10000-final.elong*10000, 2));
    // });

    let suggest = {
        center:final,
        nearSite: nearResult.slice(0,5),
    
    };




    console.log(suggest);
    res.send(suggest);


});


router.post('/createCenterOptions', async (req, res) => {

    console.log(req.body.length);
    res.send(req.body);
    let sql = 'INSERT INTO restaurants (name, address, lat, lng, place_id, category, price_level, user_ratings_total, rating, center) VALUES ?';
    let values = [];
    for(let x of req.body){
        let eachValue = [x.name, x.formatted_address, x.geometry.location.lat, x.geometry.location.lng,
            x.place_id, JSON.stringify(x.types), x.price_level? x.price_level:2, x.user_ratings_total, x.rating, '陽明山'];
        values.push(eachValue);
    }
    await queryPool(sql,[values]);

});


// 頁數迴圈的寫法, 暫時無法使用
router.get('/googleApiTest', async (req, res) => {

    let results = [];
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?location=25.0399316,121.5624083&radius=2000&type=restaurant&language=zh-TW&key=AIzaSyBnr8RhoIjlRKQ7iTT8yM7IfQJpv64znyg`;
    let nextPage = "";
    let count = 0;


    do{
        let addition = nextPage? ('&pagetoken='+nextPage) : "";
        await axios.get(url+addition)
        .then(async response => {
            
            // let restaurant = [];
            for(let x of response.data.results){
                // if(x.price_level==2 && x.rating > 4){

                // }
                // let obj = {}
                // obj.name = x.name;
                // obj.location = x.geometry.location;
                results.push(x);
            }
            nextPage = response.data.next_page_token;
            count+=1

            console.log(count);
            console.log(nextPage);
        });

    } while(nextPage)
    
    console.log('length'+results.length);
    res.send(results);


});


router.get('/googleApiGetId', async (req, res) => {

    await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURI('天母古道親山步道')}&inputtype=textquery&key=AIzaSyBnr8RhoIjlRKQ7iTT8yM7IfQJpv64znyg`)
    .then(async response => {
        

        console.log(response.data.candidates[0].place_id);

    });

    // let place = ["大稻埕碼頭_PIER5","關渡碼頭_甘豆門","大佳碼頭-圓山仔","陽明山溫泉區_小油坑","大屯山系_軍艦岩親山步道","七星山系_天母古道親山步道","國立故宮博物院","國立臺灣科學教育館","國立臺灣博物館","陽明書屋","士林官邸","臺北市立美術館","台北當代藝術館","北投溫泉博物館 ","光點臺北","臺北市立天文科學教育館","信義公民會館暨眷村文化公園_四四南村","袖珍博物館","西門紅樓","台北故事館","林安泰古厝民俗文物館","台北啤酒工場","臺北國際藝術村","平溪天燈","基隆廟口","南港山系_更寮古道親山步道","五指山系_金面山親山步道","二格山系-仙跡岩親山步道","陽明山國家公園","大安森林公園","關渡自然公園","大湖公園","碧湖公園","內溝溪景觀生態步道","北投公園","社子島島頭公園","臺北市立動物園","北投圖書館","美堤碼頭","錫口(彩虹)碼頭","紀州庵文學森林","草山行館","華中河濱公園","松山文創園區","碧湖步道","白石湖吊橋","內雙溪自然公園","臺北松山機場觀景台","士林官邸公園","彩虹橋","擎天崗草原","大佳河濱公園","迎風河濱公園","寶藏巖","臺北植物園","延平河濱公園","臺灣大學","花博公園","陽明山夜景","臺北小巨蛋","淡水老街","碧潭風景區","烏來老街","板橋湳雅觀光夜市","九份老街","猴硐","十分老街","平溪老街","菁桐老街","深坑老街","鶯歌陶瓷老街","三峽老街","金山金包里老街","三腳渡擺渡口","平等里櫻花","碧山露營場","復興三路櫻花隧道","糶米古道","象山公園","古亭河濱公園","三創生活園區","農禪寺","140高地公園","貓空纜車","竹子湖","關渡水岸公園","華西街觀光夜市","士林觀光夜市","饒河街觀光夜市","迪化街年貨大街","寧夏觀光夜市","景美夜市","臨江街觀光夜市","雙城街夜市","南機場夜市","西昌街觀光夜市","延三觀光夜市","西門町","信義商圈","富錦街","永康街區","捷運中山站街區_心中山線形公園","台北地下街","華山1914文化創意產業園區","桂花吊橋步道","夢幻湖","陽明山美軍俱樂部","彩虹河濱公園","MAJI集食行樂_圓山花博爭豔館","艋舺龍山文創B2","社子島迎星碼頭","東區商圈","貓空樟樹步道","臺灣戲曲中心","美堤河濱公園","公館商圈","臺北流行音樂中心","成美右岸河濱公園","赤峰街","湖山六號公園"];

    
    // let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURI(place[0])}&inputtype=textquery&key=AIzaSyBnr8RhoIjlRKQ7iTT8yM7IfQJpv64znyg`;

    //     for(let x of place){
    //         await axios.get(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURI(x)}&inputtype=textquery&key=AIzaSyBnr8RhoIjlRKQ7iTT8yM7IfQJpv64znyg`)
    //         .then(async response => {
                
    //             let sql = `UPDATE sites_chosen SET place_id = '${response.data.candidates[0].place_id}' WHERE name = '${x}';`;
    //             await queryPool(sql,null);
    //             console.log(response.data.candidates[0].place_id);

    //         });
    //     }


});





module.exports = router;
