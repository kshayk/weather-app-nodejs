$(document).ready(function() {
  $('.deleteSearch').on('click', deleteUser);

  $('.UseSearch').on('click', searchAgain);

  $('#hourChart').hide();

  $('#daily-button').on('click', function() {
      if($('#dailyButtonLabel').hasClass('btn-success')) {
          console.log('clicked1');
          return;
      }

      $('#dailyButtonLabel').attr('class', 'btn btn-success');
      $('#hourlyButtonLabel').attr('class', 'btn btn-default');
      $('#dayChart').show();
      $('#hourChart').hide();
  });

  $('#hourly-button').on('click', function() {
      if($('#hourlyButtonLabel').hasClass('btn-success')) {
          return;
      }

      $('#hourlyButtonLabel').attr('class', 'btn btn-success');
      $('#dailyButtonLabel').attr('class', 'btn btn-default');
      $('#hourChart').show();
      $('#dayChart').hide();
  });
});

function deleteUser() {
  var confirmation = confirm('Are you sure?');

  if(confirmation) {
    $.ajax({
      type: 'DELETE',
      url: `/search/delete/${$(this).data('id')}`
    }).done((response) => {
      window.location.replace('/');
    });

    window.location.replace('/');
  } else {
    return false;
  }
};

function searchAgain() {
    var address = $(this).data('address');
    var city = $(this).data('city');
    var country = $(this).data('country');

    $('#addressInput').val(address);
    $('#cityInput').val(city);
    $('#countryInput').val(country);

    $('#addressForm').submit();
}
