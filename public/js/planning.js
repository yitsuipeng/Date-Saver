// const { ConfigurationServicePlaceholders } = require("aws-sdk/lib/config_service_placeholders");

let map; 
let markers = [];
let optionMarkers = [];
let placeMarkers = [];
let routeMarkers = [];
let interview = [];
let selfChosen = {};
const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');

let plan = {
    startPoint: {},
    schedule: [],
    startDate: 0,
    totalTime:0,
    totalDistance:0,
    name :"",
};

let options = {};

let styles = [
    {
      featureType: 'water',
      stylers: [
        { color: '#A3D9F0' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 },
        { visibility: 'off' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' },
        { visibility: 'off' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
    },{
      featureType: 'transit.station',
      stylers: [
        { weight: 3 },
        { hue: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
    },{
      featureType: "road",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },{
      featureType: "poi",
      elementType: "labels.text",
      stylers: [
        { visibility: 'on' }
      ]
    }
  ];

dragula([document.getElementById('schedule')], {
    removeOnSpill: false,
});

async function initMap() {

  if(token) {
    fetch(`api/1.0/verifyUser`, {
      method: 'GET',
      headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': token
      })
    })
    .then(res => res.json())
    .then(res => {
  
      if(!res.data.access_token){

        Swal.fire({
          title: '哎呀',
          text: '請先登入喔',
          icon: 'warning',
          showConfirmButton: false,
          timer: 1500
        }).then(()=>{
               
            window.location.replace("sign.html");
        });

      }else{

        Swal.fire({
          title: '溫馨小提示',
          text: '輸入約會起點並按下搜尋，讓我們為你推薦下個景點',
          confirmButtonColor: '#ff6863'

        });
      }
  
    })
    .catch(error => {
      Swal.fire({
        title: '哎呀',
        text: '請先登入喔',
        icon: 'warning',
        showConfirmButton: false,
        timer: 1500
      }).then(()=>{
        window.localStorage.removeItem('Authorization');   
        window.location.replace("sign.html");
      });
        return error;
    });

  } else {
    Swal.fire({
      title: '哎呀',
      text: '請先登入喔',
      icon: 'warning',
      showConfirmButton: false,
      timer: 1500
    }).then(()=>{
      window.localStorage.removeItem('Authorization');   
      window.location.replace("sign.html");
    });

  }
    const searchAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('places-input'),{
        location: {lat:25.0591607,lng:121.5387777},
        radius:2000,
        componentRestrictions: {country: 'TW'}
    });

    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: {lat:25.0591607,lng:121.5387777},
      styles: styles,
      // mapTypeControl: true
    });

    searchAutocomplete.addListener('place_changed', () => {
    
      let place = searchAutocomplete.getPlace();

      if (!place.geometry) {

        warningAlert('沒有相符的地點喔');
    
      } else if (place.formatted_address.indexOf("北市")>0 || place.formatted_address.indexOf("Taipei")>0) {    

        plan.startPoint = {};
        plan.startPoint.url = place.url,
        plan.startPoint.name = place.name;
        plan.startPoint.rating = place.rating;
        plan.startPoint.location = {lat:place.geometry.location.lat(),lng:place.geometry.location.lng()};
        plan.startPoint.address = place.formatted_address;
        // plan.startPoint.types = JSON.stringify(place.types);
        plan.startPoint.place_id = place.place_id;
          
      } else {
        
        warningAlert('只限大台北地區喔，請見諒');

      }   
    });

    document.getElementById('start').addEventListener('click', async () => {
      console.log();

      if(document.getElementById('places-input').value.indexOf("北市")>0 || document.getElementById('places-input').value.indexOf("Taipei")>0){

        //清空
        hideMarkers(placeMarkers);
        hideMarkers(optionMarkers);
        optionMarkers = [];
        placeMarkers = [];
        routeMarkers = [];
        interview = [];
        options = {};

        selfChosen[plan.startPoint.name] = plan.startPoint;  //到列印再存

        await fetch(`api/1.0/option/${JSON.stringify(plan.startPoint.location)}`, {
          method: 'GET',
          headers: new Headers({
          'Content-Type': 'application/json'
          })
        })
        .then(res => res.json())
        .then(res => {
    
            for(let x of res.nearSite){
    
                let location = {lat:x.lat,lng:x.lng};
                    options[x.name] = {
                    name: x.name,
                    location: location,
                    place_id: x.place_id,
                    photo: x.photo,
                    url: x.url,
                    place_key: x.place_key,
                    address: x.address
                };
    
                var icon = {
                  url: `https://${host}/date-saver/icons/star.png`,
                  size: new google.maps.Size(35, 35),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(15, 34),
                  scaledSize: new google.maps.Size(25, 25)
                };
    
                marker = new google.maps.Marker({
                  position: location,
                  map: map,
                  animation: google.maps.Animation.DROP, // DROP掉下來、BOUNCE一直彈跳
                  icon: icon,
                  title: x.name
                });

                marker.addListener('click', function() {
                  createBigCard(options[this.title]);
                });
          
                optionMarkers.push(marker);
    
            }
            let optionArray = Object.keys(options);
            // optionArray.shift();
            // createOptions(optionArray,document.getElementById('near-option'),null);
            let sideOptionsArray = Object.values(options);
            sideOptions(sideOptionsArray);
            showListings(optionMarkers);
            console.log(options);
    
        })
        .catch(error => {
            console.error('Error:', error);
            return error;
        });

        marker = new google.maps.Marker({
          position: plan.startPoint.location,
          map: map,
          animation: google.maps.Animation.bounce, // DROP掉下來、BOUNCE一直彈跳
          // draggable: true, // true、false可否拖拉
          title: plan.startPoint.name
        });
        markers.push(marker);

        document.getElementById("recommend-site").innerHTML = "";
        document.getElementById('self-chosen-site').innerHTML = "";
        document.getElementById("interesting-distance").innerHTML = "";
        document.getElementById("interesting-time").innerHTML = "";
        
        addSchedule(document.getElementById('schedule'),plan.startPoint.name);
        map.setCenter(plan.startPoint.location);
        filterSelection("shop");
        
      }else{

        warningAlert('地點好像有誤喔，請修正一下');

      }
    
    });
  
    // 監聽搜尋頁列出選項
    // document.getElementById('search-places').addEventListener('click', textSearchPlaces);

    // 嘗試
    document.getElementById('sidebar').addEventListener('click', (e) => {

      if(e.target.localName == 'a'){

        document.getElementById("interesting-distance").innerHTML = "";
        document.getElementById("interesting-time").innerHTML = "";
        document.getElementById("recommend-site").innerHTML = "";
        document.getElementById('self-chosen-site').innerHTML = "";

        removeRoutes();
        let pin = options[e.target.title];
        showListings(optionMarkers);
        bounceListings(map,optionMarkers,pin.name);
        bounceListings(map,markers,pin.name);
  
        createBigCard(pin);
      }

    })

    document.getElementById('near-option').addEventListener('click', (e) => { //這個已經無效了

      removeRoutes();
      let pin = options[e.target.title];
      showListings(optionMarkers);
      bounceListings(map,optionMarkers,pin.name);
      bounceListings(map,markers,pin.name);

      createBigCard(pin);

    });

    document.getElementById('self-chosen-site').addEventListener('click', (e) => {
      let pin = e.target;

      if(pin.className == 'plus'){
          let team = options[pin.parentNode.title]? options : selfChosen;
          addSchedule(document.getElementById('schedule'),pin.parentNode.title);
          let newMarker = new google.maps.Marker({
              position: team[pin.parentNode.title].location,
              map: map,
              animation: google.maps.Animation.DROP, // DROP掉下來、BOUNCE一直彈跳
              draggable: false, // true、false可否拖拉
              title: pin.parentNode.title,
          });
          if(team == options){
            selfChosen[pin.parentNode.title] = options[pin.parentNode.title];
          }
      
          markers.push(newMarker);
          pin.parentNode.remove();
          // hideMarkers(placeMarkers);
          showListings(optionMarkers);
          showListings(markers);
          console.log(selfChosen);

          getRecommender(selfChosen[pin.parentNode.title].place_id);
          
      } else if(pin.className == 'drag-drop-item list-group-item'){
      }

    });

    document.getElementById('schedule').addEventListener('click', (e) => {
      let pin = e.target;
      plan.schedule = [];

      showListings(optionMarkers);

      if(pin.className == 'minus'){
        // 這裡要改成remove這個marker跟刪掉這個node
        console.log(pin.parentNode.title);
        removeMarkers(markers,pin.parentNode.title);
        pin.parentNode.remove();
        showListings(markers);

          
      } else if(pin.className == 'drag-drop-item list-group-item'){
        showListings(markers);
        bounceListings(map,markers,pin.title);
      }

    });

    document.getElementById('optimize-schedule').addEventListener('click', async() => {
        let scheduleArrey = document.getElementById('schedule');
        console.log(scheduleArrey.children);
        let scheduleInput = [];
        for(let x of scheduleArrey.children){
            scheduleInput.push(selfChosen[x.title]);
        }
        
        if(scheduleInput.length>9){

          warningAlert('行程好像有點多，要不要刪掉一些呢?');

        }else if(scheduleInput.length>1){

          await fetch('api/1.0/optimization', {
                method: 'POST',
                headers: new Headers({
                'Content-Type': 'application/json'
                }),
                body:JSON.stringify(scheduleInput)
            })
            .then(res => res.json())
            .catch(error => {
                console.error('Error:', error);
            })
            .then(response => {
                console.log(response);
                refreshSchedule(response,document.getElementById('schedule'));

                Swal.fire({
                  icon: 'success',
                  title: '完成',
                  showConfirmButton: false,
                  timer: 1500
                });

            });
        }
    });

    document.getElementById('make-schedule').addEventListener('click', async() => {
        let scheduleArrey = document.getElementById('schedule');
        let scheduleInput = [];
        removeRoutes();
        
        for(let x of scheduleArrey.children){
            scheduleInput.push(selfChosen[x.title]);
        }

        if(scheduleInput.length<2){

          warningAlert('約會好像太短了,再多加一些回憶吧!');
                  
        }else{
          rankMarkers(scheduleInput);

          console.log(scheduleInput);

          await calculateAndDisplayRoute(scheduleInput)
          .then(result => {
            console.log(plan);
            plan.schedule = result;

            return window.setTimeout(( () => {
              document.getElementById("interesting-distance").innerHTML = '移動距離: ' + (plan.totalDistance/1000).toFixed(1) +'公里';
              document.getElementById("interesting-time").innerHTML = '移動時間: ' + turnTimeText(plan.totalTime)[0] + '小時 '+turnTimeText(plan.totalTime)[1]+'分鐘';
              document.getElementById('self-chosen-site').innerHTML = `<br><ul><li><i class="fa fa-check-circle text-primary"></i> ${plan.schedule[0].name}</li><li>${plan.schedule[0].address}</li></ul><br>`;

              for(let i=1 ; i<plan.schedule.length ; i++){
                  let content = `<ul><li><i class="fa fa-check-circle text-primary"></i> ${plan.schedule[i].name}</li><li> ${plan.schedule[i].address} </li><li> ${plan.schedule[i].mode} / ${plan.schedule[i].distance.text} / 約 ${plan.schedule[i].duration.text}</li></ul><br>`;
                  document.getElementById('self-chosen-site').innerHTML += content;
              }

            }), 1000);
          })
          .catch(error => {

            warningAlert('系統忙碌中，請稍後再試');

            console.log('Error:', error);
          });

        }

    });

    document.getElementById('save-schedule').addEventListener('click', () => {
      if(plan.totalTime ==0 || plan.totalDistance==0){

        warningAlert('請先匯出路徑再儲存喔!');

      } else {

        // document.getElementById("plan-name").innerHTML = plan.name;
        // document.getElementById("plan-date").innerHTML = plan.startDate;
        // document.getElementById("plan-distance").innerHTML = (plan.totalDistance/1000).toFixed(1) +'km';
        // document.getElementById("plan-time").innerHTML = turnTimeText(plan.totalTime)[0] + 'hr '+turnTimeText(plan.totalTime)[1]+'min';
        // document.getElementById("plan-details").innerHTML = `<ul><li><i class="fa fa-check-circle text-primary"></i>${plan.schedule[0].name}</li><li>${plan.schedule[0].address}</li></ul>`;

        // for(let i=1; i<plan.schedule.length; i++){
        //   document.getElementById("plan-details").innerHTML += `<ul><li><i class="fa fa-check-circle text-primary"></i>${plan.schedule[i].name}</li><li>${plan.schedule[i].address}</li></ul>`;
        // }
        document.getElementById("myModal").style.display = "block";
        
        console.log(plan);
      }
    });

    document.getElementsByClassName("close")[0].onclick = function() {
      document.getElementById("myModal").style.display = "none";
    }

    window.onclick = function(event) {
      if (event.target == document.getElementById("myModal")) {
        document.getElementById("myModal").style.display = "none";
      }
    }

    document.getElementById('done').addEventListener('click', async() => {
      if(!document.getElementById('date').value || !document.getElementById('name').value){

        warningAlert('請輸入約會日期跟旅程名稱喔!');

      } else if(plan.totalTime ==0 || plan.totalDistance==0) {

        warningAlert('請先匯出路徑才能儲存旅程喔!');

      } else {
        plan.startDate = document.getElementById('date').value;
        plan.name = document.getElementById('name').value;

        fetch('api/1.0/savePlanning', {
          method: 'POST',
          headers: new Headers({
              'Content-Type': 'application/json',
              'Authorization': window.localStorage.getItem('Authorization')
              }),
          body:JSON.stringify({plan})
        })
        .then(res => res.json())
        .then(result => {
            console.log(result);
            if(result.data){
              
              Swal.fire({
                title: '抱歉',
                text: '登入過期，請重新登入後再使用',
                icon: 'error',
                confirmButtonColor: '#ff6863',
              });
            } else if(result.success){
              Swal.fire({
                icon: 'success',
                title: '祝你一路順風',
                showConfirmButton: false,
                timer: 1500
              })
              .then(()=>{
                window.location.replace("profile.html");
              });
              
            } else {

              warningAlert('系統忙碌中，請稍後再試');

            }
        })
        .catch(error => {
            console.error('Error:', error);
            return error;
        })
      }

    });

    document.getElementById("recommend-site").addEventListener('click', async(e) => {

      let pin = e.target;
      selfChosen[pin.parentNode.title] = options[pin.parentNode.title];
      console.log(pin.parentNode.title);

      if(pin.className == 'abb_plus'){

          addSchedule(document.getElementById('schedule'),pin.parentNode.title);
          let newMarker = new google.maps.Marker({
              position: selfChosen[pin.parentNode.title].location,
              map: map,
              animation: google.maps.Animation.DROP, // DROP掉下來、BOUNCE一直彈跳
              draggable: false, // true、false可否拖拉
              title: pin.parentNode.title,
          });
      
          markers.push(newMarker);
          showListings(optionMarkers);
          showListings(markers);
          console.log(selfChosen);
          
      }


    });

}

//標點工具
function showListings(markers) {
  // var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    // bounds.extend(markers[i].position);
    markers[i].setAnimation(null);
  }
  map.setZoom(13);
  // map.fitBounds(bounds);
  console.log(markers);

}

function bounceListings(map,markers,name) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].title==name){
      markers[i].setAnimation(google.maps.Animation.BOUNCE);
      map.setCenter(markers[i].position);

    } else markers[i].setAnimation(null);
  }
  
}

function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function removeMarkers(markers,name) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].title==name){
      markers[i].setMap(null);
      markers.splice(i,1);
      break;
    }
  }
  console.log(markers);
}

function rankMarkers(array) {
  for (var i = 0; i < array.length; i++) {
    for(var j = 0; j < markers.length; j++){
      if(markers[j].title==array[i].name){
        markers[j].setLabel((i+1).toString());
        markers[j].setAnimation(null);
      }
    }
  }
}

function removeRoutes(){
  if(routeMarkers.length!=0){
    for(let x of routeMarkers){
      x.setMap(null);
      x.setPanel(null);
      x = null; 
    }
  }
}


// 生成導航
async function calculateAndDisplayRoute(scheduleArrey) {
  plan.totalTime = 0;
  plan.totalDistance = 0;
  routeMarkers = [];
  console.log(scheduleArrey);


  // 繪製路線
  return new Promise((resolve, reject) => {

    let directionsService = new google.maps.DirectionsService();

    for(let i=0; i<scheduleArrey.length-1; i++){
      let directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
      });

      routeMarkers.push(directionsRenderer);

      console.log(scheduleArrey[i].name);
      var request = {
          origin: scheduleArrey[i].location,
          destination: scheduleArrey[i+1].location,
          travelMode: 'TRANSIT',
          transitOptions: {
              routingPreference:'FEWER_TRANSFERS'
          }
      };
      directionsService.route(request, function (result, status) {
        if (status == 'OK') {

          console.log(result);

          let legs = result.routes[0].legs[0];

          scheduleArrey[i+1].duration = legs.duration;
          scheduleArrey[i+1].distance = legs.distance;
          scheduleArrey[i+1].mode = result.routes[0].fare? "公共運輸" : "步行";

          let steps = result.routes[0].legs[0].steps;

          plan.totalTime += legs.duration.value;
          plan.totalDistance += legs.distance.value;

          routeMarkers[i].setDirections(result); //這裡對應除掉的動作

        } else {
          console.log(status);
        }
      });
    }
    if(scheduleArrey==scheduleArrey){resolve(scheduleArrey);}
    else{reject(console.log("something wrong whis google api"))};
    

  });
    
}

// 搜尋工具 先不用
function textSearchPlaces() {
  if(!markers[0].position){
    alert('請選旅程起點喔');
  }else if(!document.getElementById('places-self-input').value){
    alert('請輸入搜尋關鍵字');
  }else{
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    hideMarkers(optionMarkers)
    var placesService = new google.maps.places.PlacesService(map);
    placesService.nearbySearch({
      keyword: document.getElementById('places-self-input').value,
      // bounds: bounds
      location: markers[markers.length-1].position,
      radius:5000
    }, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        if (results.length == 0) {
          window.alert('沒有找到相符的地點喔, 請調整搜尋內容');
        } else {
          // 每一個找到的點顯示icon 名字 地址
          createMarkersForPlaces(results.slice(0,10));
        }
        console.log(results);
      } else if(status=='ZERO_RESULTS'){
        window.alert('沒有找到相符或是太遠, 要不要找近一點的選項?');
      }
    });
  }
}

function createMarkersForPlaces(places) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    var rating = place.rating? place.rating:0;
    var userRating = place.user_ratings_total? place.user_ratings_total:0;
    var icon = {
      url: `https://${host}/date-saver/icons/star.png`,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };
    
    var marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id,
      label: rating.toString()+' ('+userRating.toString()+')'
    });
    // Create a single infowindow to be used with the place details information so that only one is open at once.
    var placeInfoWindow = new google.maps.InfoWindow();
    // 點擊後打details
    marker.addListener('click', function() {
      if (placeInfoWindow.marker == this) {
        console.log("This infowindow already is on this marker!");
      } else {
        getPlacesDetails(this.id);
      }
    });
    placeMarkers.push(marker);
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
    
  }
  map.fitBounds(bounds);
  console.log(placeMarkers);
}

function getPlacesDetails(placeId) {

  let service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: placeId
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {

      const value = {
        place_id : results.place_id,
        name : results.name,
        location : results.geometry.location,
        rating : results.rating,
        address : results.formatted_address,
        photo : results.photos[0].getUrl(),
        url : results.url,
        icon: results.icon
        // types : JSON.stringify(results.types)
      };
      selfChosen[results.name] = value;

      document.getElementById('self-chosen-site').innerHTML = `<div class='drag-drop-item list-group-item' title='${results.name}'><strong>${results.name}</strong>
            <img class="plus" src="https://${host}/date-saver/icons/plus.png">
            <br>${results.formatted_address}
            <br><a href='${results.url}' target="_blank" >在 Google 地圖上查看</a>
            <br><img src="${results.photos[0].getUrl({maxHeight: 300, maxWidth: 600})}">
            </div>`;

    } else console.log(status);
  });
}

//生成行程卡
function createOptions(array,parentNode,title) {
    
    let inner="";
    for(let x of array){
        inner += `<div class='filterDiv ${options[x].place_key} ' title='${x}'>${x}
        </div>`;

    }
    parentNode.innerHTML = inner;

}

function addSchedule(parentNode,title) {
    
    parentNode.innerHTML += `<div class='drag-drop-item list-group-item' title='${title}'>${title}
      <img class="minus" src="https://${host}/date-saver/icons/minus.png">
    </div>`;

}

function refreshSchedule(array,parentNode) {
    
    let inner="";
    for(let x of array){
        inner += `<div class='drag-drop-item list-group-item' title='${x.name}'>${x.name}
        <img class="minus" src="https://${host}/date-saver/icons/minus.png">
        </div>`;
    }
    parentNode.innerHTML = inner;

}

function turnTimeText(time){
  let output =[];
  output[0] = Math.floor(time/3600);
  output[1] = Math.round(time%3600/60);
  return output;

}

function createBigCard(pin) {
    
  document.getElementById('self-chosen-site').innerHTML = `<div class='list-group-item' title='${pin.name}'><strong>${pin.name}</strong>
  <img class="plus" src="http://${host}/date-saver/icons/plus.png">
  <br>${pin.address}
  <br><a href='${pin.url}' target="_blank" >在 Google 地圖上查看</a>
  <br><img src="https://${host}/date-saver/photos/${pin.photo}">
  </div>`;

}

function getRecommender(placeId){
  console.log(placeId);
  let recommendMarker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.BOUNCE, // DROP掉下來、BOUNCE一直彈跳
  });

  fetch(`api/1.0/recommendation/${placeId}`, {
    method: 'GET',
    headers: new Headers({
    'Content-Type': 'application/json'
    })
  })
  .then(res => res.json())
  .then(res => {
    if(!res.data){
      console.log(res);
      document.getElementById("recommend-site").innerHTML = "";

    }else{
      console.log("recommend site:" +res.data.length);

      let testimonial = [];
      document.getElementById("recommend-site").innerHTML = "";

      for(let x of res.data){
    
        let location = {lat:x.lat,lng:x.lng};
        options[x.name] = {
          name: x.name,
          location: location,
          place_id: x.place_id,
          photo: x.photo,
          url: x.url,
          place_key: x.place_key,
          address: x.address
        };
        testimonial.push(x.name);
  
      }

      for(let x of testimonial){

        document.getElementById("recommend-site").innerHTML += 

        `<div class="about_bottom_item m-top-20">
            <div class="abb_head">
                <div class="front abb_head_icon">
                  <i class="icofont icofont-heart"></i>
                </div>
                <div class="back abb_head_icon" title="${options[x].name}">
                  <img class="abb_plus" src="http://${host}/date-saver/icons/plus.png">
                </div>
                <br>
                <br><strong>${options[x].name}</strong>
                <br>${options[x].address}
                <br><a href='${options[x].url}' target="_blank" >在 Google 地圖上查看</a>
            </div>
          </div>`;
        
      }

    }

  })
  .catch(error => {
    console.error('Error:', error);
  });

}

//測試生成側邊行程卡
function sideOptions(sideOptionsArray) {

  document.getElementById('shop').innerHTML = "";
  document.getElementById('park').innerHTML = "";
  document.getElementById('fun').innerHTML = "";
  document.getElementById('art').innerHTML = "";
  document.getElementById('movie').innerHTML = "";
    
  for(let x of sideOptionsArray){

    document.getElementById(`${x.place_key}`).innerHTML += `<a title="${x.name}">${x.name}</a>`;

  }


}

// sweet alert
function warningAlert(warning){

  Swal.fire({
    title: '哎呀',
    text: warning,
    icon: 'warning',
    confirmButtonColor: '#ff6863',
  })

}
