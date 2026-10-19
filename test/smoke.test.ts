describe('toolchain', () => {
  it('loads jquery and jquery ui sortable in the browser', () => {
    assert.isFunction($);
    assert.isFunction($('div').sortable);
  });
});
