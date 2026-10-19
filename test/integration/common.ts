export interface FindOptions {
  text?: string;
  value?: string;
  section?: string;
  checked?: boolean;
}

var $fixture: JQuery | null = null;
var selectCount = 1;
function createFixtureSelect (): HTMLSelectElement {
  var select = document.createElement('select');
  select.id = 'select-' + selectCount;
  ++selectCount;
  select.setAttribute('multiple', 'multiple');
  $fixture!.append(select);
  return select;
}

beforeEach(() => {
  $fixture = $('#fixture');
  if (!$fixture.length) {
    $fixture = $('<div id="fixture"></div>');
    $('body').append($fixture);
  }

  selectCount = 0;
  $fixture.empty();
  createFixtureSelect();
});

export default {
  assertSelection (el: Element | JQuery, params: FindOptions) {
    var $el = $(el);
    assert($el.hasClass('item'));
    assert.equal(this.textOf($el), params.text);
    assert.equal($el.attr('data-value'), params.value);
  },

  assertSelected (el: Element | JQuery, params: FindOptions) {
    var $el = $(el);
    assert($el.hasClass('item'));
    assert.equal(this.textOf($el), params.text);
    assert.equal($el.attr('data-value'), params.value);
    var $sectionName = $el.children('.section-name');
    assert.equal($sectionName.length, 1);
    assert.equal(this.textOf($sectionName), params.section);
  },

  createFixtureSelect: createFixtureSelect,

  textOf (el: Element | JQuery<Element>): string {
    var $el = $(el);
    var $label = $el.children('label');
    if ($label.length) {
      return $label.first().text();
    } else {
      return $el.clone().children().remove().end().text();
    }
  },

  // DOM element finders
  find (container: string, options?: FindOptions): JQuery {
    var text: string | undefined;
    var value: string | undefined;

    if (options) {
      text = options.text;
      value = options.value;
    }

    var selector = container + (value ? `[data-value=${value}]` : '');
    var $els = $(selector);

    if (text) {
      $els = $els.filter((idx, el) => {
        return this.textOf(el) === text;
      });
    }

    return $els;
  },

  findCheckbox (container: string, options?: FindOptions): JQuery {
    var $els = this.find(container, options).children('input[type=checkbox]');
    if (options && options.checked) {
      $els = $els.filter((idx, el) => {
        return (el as HTMLInputElement).checked === options.checked;
      });
    }
    return $els;
  },

  selection (options?: FindOptions): JQuery {
    return this.find('.selections .item', options);
  },

  selected (options?: FindOptions): JQuery {
    return this.find('.selected .item', options);
  },

  section (options?: FindOptions): JQuery {
    // need to search title text, then go back up to section
    return this.find('.selections .section > .title', options).parent();
  },

  selectionCheckbox (options?: FindOptions): JQuery {
    return this.findCheckbox('.selections .item', options);
  },

  sectionCheckbox (options?: FindOptions): JQuery {
    return this.findCheckbox('.selections .section > .title', options);
  }
};
