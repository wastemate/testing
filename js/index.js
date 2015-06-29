var wma_viewModel;

/* Adds getNextWeekDay(dow) to the Date type*/
Date.prototype.getNextWeekDay = function (d) {
    if (d) {
        var next = this;
        next.setDate( this.getDate() - this.getDay() + 7 + d );
        return next;
    }
};

Date.prototype.toJSONLocal = function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toISOString().slice(0, 10);
};

$(document).ready(function(){

  var appKey = '6YJjl9Tlu9gml6IR0YfXrOIkY9SxqCfP2bshQELI';
  var jsKey = 'DEIXEICevT5qkR1zQxvj8PVHrvWu4XPKN2QUhhmL';
  wma_viewModel = new viewModel();
  ko.applyBindings(wma_viewModel);

  wastemate.initialize(appKey, jsKey)
    .then(function(categories){
      //make search visible!
      wma_viewModel.show('search');
      //After the search is made visible, hookup live address library to the UI input.
      wireUpLiveAddress('#street_address', '4160067421270775959');
      
      //Add each of the categories to the UI
      $.each(categories, function(index, category){
        wma_viewModel.categories.push(category);  
      });
  }, function(err){
    //something must not be right!
    console.log(err);
    alert("Unable to connect. Double check the settings!");
    $('#loading').fadeOut();
    $('#initialize').fadeIn();
  });
});