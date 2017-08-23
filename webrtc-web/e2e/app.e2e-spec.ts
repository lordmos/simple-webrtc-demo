import { WebrtcWebPage } from './app.po';

describe('webrtc-web App', () => {
  let page: WebrtcWebPage;

  beforeEach(() => {
    page = new WebrtcWebPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
