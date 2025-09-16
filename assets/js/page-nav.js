(function(){
  function createPager(container){
    const prevLink = document.querySelector('link[rel="prev"]');
    const nextLink = document.querySelector('link[rel="next"]');
    if(!prevLink && !nextLink){
      return;
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

    const firstContentElement = container.firstElementChild;
    if(firstContentElement){
      container.insertBefore(nav, firstContentElement);
    }else{
      container.appendChild(nav);
    }
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

  function createSectionNav(container){
    const headings = Array.from(container.querySelectorAll('.md-typeset h2[id]'))
      .filter((node)=>!node.classList.contains('no-section-nav'));
    if(headings.length < 2){
      return;
    }

    const nav = document.createElement('nav');
    nav.className = 'section-pills';

    const label = document.createElement('span');
    label.className = 'section-pills__label';
    label.textContent = '節へ移動';
    nav.appendChild(label);

    const list = document.createElement('div');
    list.className = 'section-pills__list';
    nav.appendChild(list);

    headings.forEach((heading)=>{
      const pill = document.createElement('a');
      pill.className = 'section-pills__item';
      pill.href = `#${heading.id}`;
      pill.textContent = heading.textContent.trim();
      list.appendChild(pill);
    });

    const target = container.querySelector('.md-typeset h1');
    if(target && target.parentNode){
      target.parentNode.insertBefore(nav, target.nextSibling);
    }else{
      container.insertBefore(nav, container.firstChild);
    }
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
    const content = document.querySelector('.md-content');
    if(!content){
      return;
    }

    createPager(content);
    createSectionNav(content);
    enhanceTables(content);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();

