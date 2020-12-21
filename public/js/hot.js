// const host = window.location.host;
const host = 'd2cw5pt7i47jz6.cloudfront.net';
const token = window.localStorage.getItem('Authorization');

let markers = [];
let blogs = {};
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

async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: {lat:25.0591607,lng:121.5387777},
        styles: styles,
        // mapTypeControl: true
      });
}


fetch(`user/getHotOrders`, {
    method: 'GET',
    headers: new Headers({
        'Authorization': token
    })
})
.then(res => res.json())
.then(res => {

    console.log(res.data);

    for(let x of res.data){

        blogs[x.name] = x;
        let content = `<div class="col-md-4" id="open-the-box" title="${x.name}">
            <div class="blog_item m-top-20">
                <div class="blog_item_img">
                    <img class="imgimgimg" src="https://${host}/date-saver/shares/${x.photo}" alt="" />
                </div>
                <div class="blog_text roomy-40">
                    <h6>${x.name}</h6>
                    <p>${x.comment}</p>
                </div>
            </div>
        </div>`;
        document.getElementById('canvas').innerHTML += content;
    }

    document.getElementById('open-the-box').addEventListener('click', (e) => {
        let pin = e.target.title;
        










        document.getElementById("myModal").style.display = "block";
    })

})
.catch(error => {
    console.error('Error:', error);
    alert('系統錯誤,請稍後再試');
    return error;
});

function turnTimeText(time){
    let output =[];
    output[0] = Math.floor(time/3600);
    output[1] = Math.round(time%3600/60);
    return output;
  
}

document.getElementsByClassName("close")[0].onclick = function() {
    document.getElementById("myModal").style.display = "none";
}

window.onclick = function(event) {
    if (event.target == document.getElementById("myModal")) {
        document.getElementById("myModal").style.display = "none";
    }
}

{/* <p><em>${x.date} / ${(x.total_distance/1000).toFixed(1)} 公里 / ${turnTimeText(x.total_duration)[0]}小時 ${turnTimeText(x.total_duration)[1]}分鐘 </em></p> */}