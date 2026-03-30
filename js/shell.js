/* --- Universal Search --- */
const searchInput = document.getElementById('universal-search');

searchInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      // TODO: route query to the appropriate module (CRM, Estimating, etc.)
      console.log('Universal search:', query);
      event.target.value = '';
      event.target.blur();
    }
  }
});
