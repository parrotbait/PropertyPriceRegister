import React, { Component } from 'react';
import { Container, Modal } from 'react-bootstrap'

export default class InfoModalView extends Component {

  render() {
    return <Modal centered show={this.props.show_info} className="filter_card" onHide={() => this.props.closeClicked()}>
    <Modal.Header closeButton>
      <Modal.Title>Why did I do this?</Modal.Title>
    </Modal.Header>
    <Modal.Body>  
          <Container>
          <br/>
            <span className="text-center">
              <p>
                A couple of years ago when buying a house I encountered the Property Price Register for the first time.
                The <a target="_blank" rel="noopener noreferrer" href="https://www.propertypriceregister.ie/website/npsra/pprweb.nsf/PPR?OpenForm">existing government site</a> leaves a lot to be desired.
                The search is clunky and doesn't work well, maps are more suited to viewing this data.
              </p>
              <p>
                  So as a pet project I decided to first take the PPR data, clean it a little, find accurate positions (where possible) and map out the properties.
                  There are inaccuracies of course, this all boils down to poor data in the first place. I have a longer piece on the general terrible state of the property price register <a target="_blank" rel="noopener noreferrer" href="https://medium.com/@parrotbait/the-property-price-register-a-rant-f55ca421e798">here</a>.
                </p>
                <p>
                Ireland does not have an official property register, but this is the best we have for now.
                Please report issues to propertypricesireland@gmail.com and I will endevour to correct the issues.
                </p>
                <p>
                  Over time I hope to add more insights such as trends to this site. I'm also looking to open up an API for those who are interested in using this data. More will be announced soon.
                </p>
            </span>
            <br/>
          </Container>
    </Modal.Body>
    </Modal>
  }
}