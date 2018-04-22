$(document).ready(function() {
  $('.deleteSearch').on('click', deleteUser);
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
}
