import React, { Component } from 'react';
import { Nav, Navbar, Row, Container } from 'react-bootstrap'
import FiltersView from './FiltersView'
import InfoModalView from './InfoModalView'
import GoogleMap from './GoogleMap'
import debounce from 'lodash/debounce';
import LoadingOverlay from 'react-loading-overlay';
import { MDBBtn, MDBIcon } from "mdbreact";
import 'react-dates/lib/css/_datepicker.css';

import './App.css';

const baseUrl = "http://localhost:4000/api"

class App extends Component {
  
  query = {
    text: '',
    counties: [],
    minPrice: null,
    maxPrice: null,
    startDate: '2018-07-01',
    endDate: "2020-12-01"
  };

  state = {
    showingInfoWindow: false,  //Hides or the shows the infoWindow
    activeMarker: {},          //Shows the active marker upon click
    selectedPlace: {},          //Shows the infoWindow to the selected place upon a marker
    selectedProperty: {},
    
    is_loading: true,
    show_filters: true,
    show_info: false,
    stores: [],
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

  onFiltersApplied = (query) => {
    this.query = query
    this.refreshProperties()
    this.setState({ show_filters: false })
  }

  delayReload = () => {
    this.refreshProperties()
  }

  createGoogleMap = () => {
    return window.google
  }

  getInfoOverlay = () => {
    return <InfoModalView 
            show_info={this.state.show_info} 
            closeClicked={() => this.setState({ show_info: false })} />
  }

  getFilterOverlay = () => {
    return <FiltersView 
            visible={this.state.show_filters} 
            counties={this.state.counties} 
            closeClicked={() => this.setState({ show_filters: false })} 
            onFiltersApplied={query => this.onFiltersApplied(query)} />
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

  refreshProperties = () => {
    this.setState({
      is_loading: true
    });
    var url = baseUrl + "/properties";
    var query = "";
    if (this.query.startDate) {
        query = "start_date=" + this.query.startDate
    }
    if (this.query.endDate) {
        if (query.length !== 0) {
            query += "&";
        }
        query += "end_date=" + this.query.endDate
    }

    if (this.query.counties && this.query.counties.length > 0) {
      if (query.length !== 0) {
          query += "&";
      }
      query += "county=" + this.query.counties.join(',');
    }

    if (this.query.minPrice) {
      if (query.length !== 0) {
        query += "&";
      }
      query += "min_price=" + this.query.minPrice;
    }

    if (this.query.maxPrice) {
      if (query.length !== 0) {
        query += "&";
      }
      query += "max_price=" + this.query.maxPrice;
    }

    if (this.query.text) {
      if (query.length !== 0) {
        query += "&";
      }
      query += "query=" + encodeURIComponent(this.query.text)
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