document.querySelectorAll('[data-toggle]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-toggle');
    document.getElementById(id)?.classList.toggle('hide');
  });
});

