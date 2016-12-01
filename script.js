$(function() {    

    var throttle = function (cb, timeLimit) {
        var wait = false;
        return function () {
          if (!wait) {
            cb();
            wait = true;
            setTimeout(function () {
              wait = false;
            }, timeLimit);
          }
        };
      };

      var errorBox = function (message) {
        $('#alertBoxPlaceholder').html('<strong>Error:</strong> ' + message);
        $('#alertBoxPlaceholder').addClass('alert alert-danger');

        setTimeout(function () {
            $('#alertBoxPlaceholder').empty();
            $('#alertBoxPlaceholder').removeClass('alert alert-danger');
        },4000);
      };

      //if the enter key is hit
      $('#address-autocomplete').on('keyup', function (e) {
        if ($('#address-autocomplete').val().length === 0 || e.keyCode === 8) {
            $('#search-options').empty();
            $('#search-options').css("display", "none");
            $('#accuracy-map').css("display", "none");
        } else if (e.keyCode !== 8) {
          //on any key up hide the map and show the search results
          $('#accuracy-map').css("display", "none");
          $('#search-options').css("display", "block");
          throttle(function () {
            //function calls the API and returns the results
            $.ajax({
                contentType: 'application/json',
                data: JSON.stringify({
                  streetAddress: $('#address-autocomplete').val()
                }),
                dataType: 'json',
                success: function(data){

                  var inHTML = "";

                  $.each(data.result, function(index, value){
                    if (index < 5) {
                      var newItem = "<a id='"+index+"' class='address-choices list-group-item'>"+ value.streetAddress + "</a>"
                      inHTML += newItem;  
                    }
                  });

                  $('#search-options').empty();
                  $('#search-options').append(inHTML);

                  $('.address-choices').on('click', function (e) {
                    //on click take data and populate below and remove the a's in the list
                    var address = e.target.innerHTML;
                    var listId = e.target.id;

                    //get the address this belongs to and print to the screen
                    $('#matched-address').html(address);
                    $('#search-options').empty();
                    $('#address-autocomplete').val(address);

                    var flatNum = data.result[listId].flatNumberPrefix + data.result[listId].flatNumber + data.result[listId].flatNumberSuffix;

                    if (flatNum) {
                      $('#matched-flat-num').html(flatNum);
                    }

                    if (data.result[listId].levelNumber) {
                      $('#matched-level').html(data.result[listId].levelNumber);
                    }

                    $('#matched-suburb').html(data.result[listId].suburb);
                    $('#matched-street-number').html(data.result[listId].numberFirst);
                    $('#matched-street-name').html(data.result[listId].streetName);
                    $('#matched-postcode').html(data.result[listId].postCode);
                    $('#matched-state').html(data.result[listId].state);
                    $('#matched-lat').html(data.result[listId].location.lat);
                    $('#matched-long').html(data.result[listId].location.lon);

                    //show the map and hide the dropdown options
                    $('#accuracy-map').css("display", "block");
                    $('#search-options').css("display", "none");

                    //get the complete address and send it to the backend to geocode as well as geocode google accuracy
                    var mappifyLat = $('#matched-lat').html(data.result[listId].location.lat)[0].textContent;
                    var mappifyLon = $('#matched-long').html(data.result[listId].location.lon)[0].textContent;

                    var googleString = $('#matched-address').html(address)[0].textContent.replace(/\s+/g,"+");
                    var googleURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" +googleString+ "&key=AIzaSyDnU6NsK3fZY_x7zfmlhUXuRXhmIrEJITE";
       
                    $.get(googleURL, function(data, status){

                      var googleLat = data.results[0].geometry.location.lat;
                      var googleLon = data.results[0].geometry.location.lng;

                      //----- reset the map
                      var mapOptions = {
                        zoom: 15,
                        center: {lat: googleLat, lng: googleLon}
                      };
                      map = new google.maps.Map(document.getElementById('map'),
                          mapOptions);

                      //get the lat and long on the map
                      var marker = new google.maps.Marker({
                        position: {lat: googleLat, lng: googleLon},
                        map: map
                      });

                      var infowindow = new google.maps.InfoWindow({
                        content: '<p>Google Maps: ' + '<br>' + googleLat + ", " + googleLon + '</p>'
                      });

                      
                      var markerMappify = new google.maps.Marker({
                        position: {lat: parseFloat(mappifyLat), lng: parseFloat(mappifyLon)},
                        map: map,
                        icon: "https://s3-ap-southeast-2.amazonaws.com/mappify/landing_2/assets/mappify-favicon.ico"
                      });

                      var infowindowMappify = new google.maps.InfoWindow({
                        content: '<p>Mappify: ' + '<br>' + mappifyLat + ", " + mappifyLon + '</p>'
                      });

                      google.maps.event.addListener(markerMappify, 'click', function() {
                        infowindowMappify.open(map, markerMappify);
                      });
                      
                      google.maps.event.addListener(marker, 'click', function() {
                        infowindow.open(map, marker);
                      });

                    });

                    $('#search-options').empty();

                  });
                },
                error: function(){
                    console.log("Device control failed");
                },
                type: 'POST',
                url: 'https://mappify.io/api/rpc/address/autocomplete'
            });

          },1000)();
        }

      });
});
