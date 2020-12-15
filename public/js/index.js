const searchAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('places-input'),{
        location: {lat:25.0591607,lng:121.5387777},
        radius:2000,
        componentRestrictions: {country: 'TW'}
      });


let initQuery = {};
let startPoint ={};

let user = { // {site, location, startTime, travelTime, stayTime, endTime, route}
};

fetch(`/api/1.0/getIndexOption`, {
    method: 'GET',
    headers: new Headers({
    'Content-Type': 'application/json'
    })

})
.then(res => res.json())
.catch(error => {
    console.error('Error:', error);
    return error;
})
.then(res => {
    
    let tagArray = Object.keys(res);

    for (let x of tagArray){

        let masonryContent = "";
        for(let y of res[x].tagSites){
            initQuery[y.name] = y;
        }


    }

    console.log(initQuery);
});


// 搜尋條件找景點
searchAutocomplete.addListener('place_changed', () => {
    
    let place = searchAutocomplete.getPlace();
    console.log(place);
    if (!place.geometry) {

        alert('沒有相符的地點喔 請更改' + place.name);
    } else if (place.formatted_address.indexOf("北市")<0) {
        alert('只限大台北地區喔, 謝謝~~');       
    } else {

        startPoint.photo = place.photos[0].getUrl(),
        startPoint.url = place.url,
        startPoint.icon = place.icon,
        startPoint.name = place.name;
        startPoint.rating = place.rating;
        startPoint.location = place.geometry.location;
        startPoint.address = place.formatted_address;
        startPoint.types = JSON.stringify(place.types);
        startPoint.place_id = place.place_id;

        window.localStorage.setItem('startPoint', JSON.stringify(startPoint));
        console.log('place save');
        
    }

});

document.getElementById('self-chosen-button').addEventListener('click', async () => {
    if(startPoint.name){
        window.location.href = 'main.html';
    } else {
        window.localStorage.removeItem('startPoint'); 
        alert('請輸入地點');
    }
});
