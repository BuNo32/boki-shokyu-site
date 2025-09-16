(function(){
  function createPagerNodes(){
    const prevLink = document.querySelector('link[rel="prev"]');
    const nextLink = document.querySelector('link[rel="next"]');
    if(!prevLink && !nextLink){
      return null;
    }

    const nav = document.createElement('nav');
    nav.className = 'page-pager';

    const title = document.createElement('span');
    title.className = 'page-pager__label';
    title.textContent = 'ページ移動';
    nav.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'page-pager__actions';
    nav.appendChild(actions);

    if(prevLink){
      actions.appendChild(buildPagerLink(prevLink, '← 前へ'));
    }
    if(nextLink){
      actions.appendChild(buildPagerLink(nextLink, '次へ →'));
    }

    return nav;
  }

  function buildPagerLink(linkElement, label){
    const href = linkElement.getAttribute('href');
    const title = linkElement.getAttribute('title') || linkElement.dataset.title;
    const a = document.createElement('a');
    a.className = 'page-pager__link';
    a.href = href;

    const spanLabel = document.createElement('span');
    spanLabel.className = 'page-pager__hint';
    spanLabel.textContent = label;
    a.appendChild(spanLabel);

    if(title){
      const spanTitle = document.createElement('span');
      spanTitle.className = 'page-pager__title';
      spanTitle.textContent = title;
      a.appendChild(spanTitle);
    }

    return a;
  }

  function createTopLink(container){
    const logoLink = document.querySelector('a.md-header__button.md-logo');
    if(!logoLink){
      return;
    }
    const href = logoLink.getAttribute('href') || 'index.html';

    const nav = document.createElement('nav');
    nav.className = 'page-toplink';

    const link = document.createElement('a');
    link.href = href;
    link.textContent = '学習トップへ戻る';
    nav.appendChild(link);

    container.insertBefore(nav, container.firstChild);
  }

  function enhanceTables(container){
    container.querySelectorAll('.tb5-wrap, .tb5-qa table').forEach((node)=>{
      if(node.classList.contains('tb5-qa-table')){
        return;
      }
      if(node.tagName === 'TABLE'){
        node.classList.add('tb5-qa-table');
      }
    });
  }

  function init(){
    const content = document.querySelector('.md-content__inner');
    if(!content){
      return;
    }

    const pager = createPagerNodes();
    if(pager){
      const bottomPager = pager.cloneNode(true);
      content.insertBefore(pager, content.firstChild);
      content.appendChild(bottomPager);
    }
    createTopLink(content);
    enhanceTables(content);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
