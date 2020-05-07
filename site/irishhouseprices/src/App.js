import React, { Component } from 'react';
import { Col, Button, Nav, Navbar, Row, Container, Dropdown, Form, DropdownButton, Modal, NavItem } from 'react-bootstrap'
import CountiesDropdown from './CountiesDropdown'
import GoogleMap from './GoogleMap'
import * as Price from './Price'
import debounce from 'lodash/debounce';
import 'react-dates/initialize';
import LoadingOverlay from 'react-loading-overlay';
import { SingleDatePicker } from 'react-dates';
import {isMobile} from 'react-device-detect';
import { MDBBtn, MDBIcon } from "mdbreact";
import 'react-dates/lib/css/_datepicker.css';

import './App.css';

var moment = require('moment');
const baseUrl = "http://localhost:4000/api"

class App extends Component {
  
  state = {
    showingInfoWindow: false,  //Hides or the shows the infoWindow
    activeMarker: {},          //Shows the active marker upon click
    selectedPlace: {},          //Shows the infoWindow to the selected place upon a marker
    selectedProperty: {},
    start_date_focussed: false,
    end_date_focussed: false,
    is_loading: true,
    show_filters: true,
    show_info: false,
    stores: [],
    query: {
      text: '',
      counties: [],
      minPrice: null,
      maxPrice: null,
      startDate: '2018-07-01',
      endDate: "2020-12-01"
    },
    counties: [],
    properties: [],
  };

  propertyLoader = (id, callback) => {
    const url = baseUrl + `/property?id=${id}`;
    const request = new Request(url)
    fetch(request, {mode: 'cors'})
    .then(res => res.json())
    .then((property) => {
      callback(property)
    })
  }

  onMarkerClick = (props, marker, e) =>
    this.setState({
      selectedPlace: props,
      selectedProperty: this.state.properties[marker.id],
      activeMarker: marker,
      showingInfoWindow: true
    });

  onMapClicked = (props) => {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        selectedProperty: null,
        activeMarker: null
      })
    }
  };
  onClose = props => {
    if (this.state.showingInfoWindow) {
      this.setState({
        showingInfoWindow: false,
        activeMarker: null
      });
    }
  };

  onCountiesSelected = counties => {
    this.setState(prevState => ({
      query: {
        text: prevState.query.text,
        startDate: prevState.query.startDate,
        endDate: prevState.query.endDate,
        minPrice: prevState.query.minPrice,
        maxPrice: prevState.query.maxPrice,
        counties: [
          counties.map(x => x.name) ] 
        }
    }), () => { this.refreshProperties() })
  };

  onStartDateChanged = (date) => {
    //console.log(date)
    let date_obj = new Date(date)
    let formatted_date = date_obj.getFullYear() + '-' + (date_obj.getMonth() + 1) + '-' + date_obj.getDate()
    this.setState(prevState => ({
      query: {
        text: prevState.query.text,
        startDate: formatted_date,
        endDate: prevState.query.endDate,
        minPrice: prevState.query.minPrice,
        maxPrice: prevState.query.maxPrice,
        counties: prevState.query.counties,
      }
    }), () => { this.refreshProperties() })
  }

  onEndDateChanged = (date) => {
    //console.log(date)
    let date_obj = new Date(date)
    let formatted_date = date_obj.getFullYear() + '-' + (date_obj.getMonth() + 1) + '-' + date_obj.getDate()
    this.setState(prevState => ({
      query: {
        text: prevState.query.text,
        startDate: prevState.query.startDate,
        endDate: formatted_date,
        minPrice: prevState.query.minPrice,
        maxPrice: prevState.query.maxPrice,
        counties: prevState.query.counties,
      }
    }), () => { this.refreshProperties() })
  }

  onMinPriceSelected = index => {
    let isDeselecting = this.state.query.minPrice === Price.priceDropdownOptions[index]
    var minPrice =  Price.priceDropdownOptions[index]
    if (isDeselecting) {
      minPrice = null
    }
    this.setState(prevState => ({
      query: {
        text: prevState.query.text,
        startDate: prevState.query.startDate,
        endDate: prevState.query.endDate,
        maxPrice: prevState.query.maxPrice,
        counties: prevState.query.counties,
        minPrice: minPrice
      }
    }), () => { this.refreshProperties() })
  }
  
  onMaxPriceSelected = (index, v) => {
    let isDeselecting = this.state.query.maxPrice === Price.priceDropdownOptions[index]
    var maxPrice =  Price.priceDropdownOptions[index]
    if (isDeselecting) {
      maxPrice = null
    }
    this.setState(prevState => ({
      query: {
        text: prevState.query.text,
        startDate: prevState.query.startDate,
        endDate: prevState.query.endDate,
        minPrice: prevState.query.minPrice,
        maxPrice: maxPrice,
        counties: prevState.query.counties
      }
    }), () => { this.refreshProperties() })
  }

  delayReload = () => {
    this.refreshProperties()
  }

  onTextEntered = (event) => {
    let text = event.target.value
    this.setState(prevState => ({
      query: {
        text: text,
        startDate: prevState.query.startDate,
        endDate: prevState.query.endDate,
        minPrice: prevState.query.minPrice,
        maxPrice: prevState.query.maxPrice,
        counties: prevState.query.counties,
      }
    }))

    this.delayReload()
  }

  createGoogleMap = () => {
    return window.google
  }

  getInfoOverlay = () => {
    return <Modal centered show={this.state.show_info} className="filter_card" onHide={() => this.setState({ show_info: false })}>
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

  getFilterOverlay = () => {
    return <Modal centered show={this.state.show_filters} className="filter_card" onHide={() => this.setState({ show_filters: false })}>
    <Modal.Header closeButton>
      <Modal.Title>Search Filters</Modal.Title>
    </Modal.Header>
    <Modal.Body>  
      <Container>
        <Row>
          <Col>Address: </Col>
          <Col>
            <Form.Control type="input" placeholder="Search address" value={this.state.query.text} onChange={this.onTextEntered} />
          </Col>
        </Row>
        <Row>
        <Col>County</Col>
            <Col>
              <CountiesDropdown 
                counties={this.state.counties}
                onCountiesSelected={this.onCountiesSelected}/>
            </Col>
          </Row>
          <Row>
            <Col>Start date</Col>
            <Col>
              <SingleDatePicker
                date={moment(this.state.query.startDate, "YYYY-MM-DD")} // momentPropTypes.momentObj or null
                onDateChange={this.onStartDateChanged} // PropTypes.func.isRequired
                onFocusChange={({ focused: focused2 }) => this.setState({ start_price_focussed: focused2 })}
                focused={this.state.start_price_focussed} // PropTypes.bool
                keepOpenOnDateSelect={false}
                enableOutsideDays={false}
                isOutsideRange={() => false}
                readOnly={true}
                small={isMobile}
                appendToBody={false}
                numberOfMonths={1}
                id="filter-start-date" // PropTypes.string.isRequired,
              />
            </Col>
          </Row>
          <Row>
            <Col>End date</Col>
            <Col>
              <SingleDatePicker
                date={moment(this.state.query.endDate, "YYYY-MM-DD")} // momentPropTypes.momentObj or null
                onDateChange={this.onEndDateChanged} // PropTypes.func.isRequired
                onFocusChange={({ focused: focused2 }) => this.setState({ end_date_focussed: focused2 })}
                focused={this.state.end_date_focussed} // PropTypes.bool
                keepOpenOnDateSelect={false}
                enableOutsideDays={false}
                isOutsideRange={() => false}
                readOnly={true}
                small={isMobile}
                appendToBody={false}
                numberOfMonths={1}
                
                id="filter-end-date" // PropTypes.string.isRequired,
              />
            </Col>
          </Row>
          <Row>
            <Col>
              Min Price
            </Col>
            <Col>
              <DropdownButton 
                    title={this.state.query.minPrice || "Select"}
                    id={`dropdown-variants-min-price`}
                    key='min-price'
                    onSelect={this.onMinPriceSelected}
                  >
                {this.getDropdownOptions(this.state.query.minPrice)}
              </DropdownButton>
            </Col>
          </Row>
          <Row>
            <Col>
              Max Price
            </Col>
            <Col>
              <DropdownButton 
                title={this.state.query.maxPrice || "Select"}
                id={`dropdown-variants-max-price`}
                key='max-price'
                onSelect={this.onMaxPriceSelected}
              >
                {this.getDropdownOptions(this.state.query.maxPrice)}
              </DropdownButton>
            </Col>
          </Row>
      </Container>
      </Modal.Body>
      </Modal>
  }

  render() {
    const filterOverlay = this.getFilterOverlay()
    const infoOverlay = this.getInfoOverlay()
    return (
      <>
        <LoadingOverlay
                active={this.state.is_loading}
                spinner
                text='Loading properties...'
              >   
          <Navbar bg="light" expand="sm" sticky="top"
          onSelect={(selectedKey) => this.setState({ show_info: true })}>
            <Navbar.Brand>Property Price Register</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
              <Nav.Link eventKey="link-1">Why</Nav.Link>
            </Navbar.Collapse>
            <MDBBtn size="sm" className="ml-auto" onClick={() => this.setState({ show_filters: true })}>
              <MDBIcon icon="filter" className="mr-1 " /> Filter
            </MDBBtn>
          </Navbar> 

          <Container fluid>
            <Row>
              <GoogleMap markers={this.state.stores} properties={this.state.properties} propertyLoader={this.propertyLoader} />
            </Row>
          </Container>
        </LoadingOverlay>
        {filterOverlay}
        {infoOverlay}
      </>
    );
  }

  componentDidMount() {
    this.refreshProperties()
    this.fetchCounties()

    this.onTextEntered = this.onTextEntered.bind(this)
    this.delayReload = debounce(this.delayReload, 500)
  }

  fetchCounties = () => {
    var url = baseUrl + "/counties";
    var request = new Request(url)
    fetch(request, {mode: 'cors'})
    .then(res => res.json())
    .then((counties) => {
      this.setState({ counties: counties })
    })
  }

  getDropdownOptions = (price) => {
    return Price.priceDropdownOptions.map((value, index) => {
      if (value === 0) {
        return <Dropdown.Item key={index} eventKey={index}>None</Dropdown.Item>
      } else {
        var active = false
        active = price === value
        if (active) {
          return <Dropdown.Item key={index} active eventKey={index}>€{Price.formatMoney(value)}</Dropdown.Item>
        } else {
          return <Dropdown.Item key={index} eventKey={index}>€{Price.formatMoney(value)}</Dropdown.Item>
        }
      }
    })
  }

  refreshProperties = () => {
    this.setState({
      is_loading: true
    });
    var url = baseUrl + "/properties";
    var query = "";
    if (this.state.query.startDate) {
        query = "start_date=" + this.state.query.startDate
    }
    if (this.state.query.endDate) {
        if (query.length !== 0) {
            query += "&";
        }
        query += "end_date=" + this.state.query.endDate
    }

    if (this.state.query.counties && this.state.query.counties.length > 0) {
      if (query.length !== 0) {
          query += "&";
      }
      query += "county=" + this.state.query.counties.join(',');
    }

    if (this.state.query.minPrice) {
      if (query.length !== 0) {
        query += "&";
      }
      query += "min_price=" + this.state.query.minPrice;
    }

    if (this.state.query.maxPrice) {
      if (query.length !== 0) {
        query += "&";
      }
      query += "max_price=" + this.state.query.maxPrice;
    }

    if (this.state.query.text) {
      if (query.length !== 0) {
        query += "&";
      }
      query += "query=" + encodeURIComponent(this.state.query.text)
    }

    if (query.length > 0) {
        url = url + "?" + query;
    }
    //console.log("url - " + url)
    var request = new Request(url)
    fetch(request, {mode: 'cors'})
    .then(res => res.json())
    .then((properties) => {
      let markers = []
      for (let i = 0; i < properties.length; ++i) {
        markers.push({ id: properties[i].uuid, latitude:properties[i].lat, longitude: properties[i].lon })
      }
      this.setState({ stores: markers, properties: properties, is_loading: false })
    })
  }
}

export default App