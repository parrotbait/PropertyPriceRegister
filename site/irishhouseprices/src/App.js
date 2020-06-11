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

const baseUrl = process.env.REACT_APP_API_BASE_URL
const apiUrl = `${baseUrl}/api`

class App extends Component {
  
  query = {
    text: '',
    counties: [],
    minPrice: null,
    maxPrice: null,
    startDate: '2020-01-01',
    endDate: "2020-12-01"
  };

  state = {
    showingInfoWindow: false,  //Hides or the shows the infoWindow
    activeMarker: {},          //Shows the active marker upon click
    selectedPlace: {},          //Shows the infoWindow to the selected place upon a marker
    selectedProperty: {},
    
    is_loading: true,
    show_filters: false,
    show_info: false,
    stores: [],
    counties: [],
    properties: [],
  };

  propertyLoader = (id, callback) => {
    const token = localStorage.getItem('token')
    if (!token) {
      this.fetchToken()
      .then(() => this.propertyLoader(id, callback))
      .catch(err => console.log(err))
      return
    }
    const url = apiUrl + `/property?id=${id}`;
    const request = new Request(url)
    fetch(request, {mode: 'cors', headers: {
        'Authorization': `Bearer ${token}`
    }})
    .catch(err => {
      console.log(JSON.stringify(err))
    })
    .then(res => {
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        localStorage.removeItem('token')
        this.fetchToken()
        .then(() => this.propertyLoader(id, callback))
        .catch(err => console.log(err))
      }
      return res
    })
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
            query={this.query}
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
    this.setState({
      is_loading: true
    });

    this.fetchToken()
    .then(() => {
      this.refreshProperties()
      this.fetchCounties()
    })

    this.delayReload = debounce(this.delayReload, 500)
  }

  fetchToken = async () => {
    // Just use the token if present
    const token = localStorage.getItem('token')
    if (token) {
      return new Promise((resolve) => {
        resolve()
      })
    }
    const url = baseUrl + "/authorize";
    var request = new Request(url)
    return fetch(request, {
      mode: 'cors', 
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        access_key: process.env.REACT_APP_ACCESS_KEY, 
        access_secret: process.env.REACT_APP_ACCESS_SECRET}
      )
    })
    .then(res => res.json())
    .then((token) => {
      localStorage.setItem('token', token.access_token)
    })
  }

  fetchCounties = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      this.fetchToken()
      .then(() => this.fetchCounties())
      .catch(err => console.log(err))
      return
    }
    const url = apiUrl + "/counties";
    const request = new Request(url)
    fetch(request, {mode: 'cors', headers: {
        'Authorization': `Bearer ${token}`
    }})
    .then(res => {
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        localStorage.removeItem('token')
        this.fetchToken()
        .then(() => this.fetchCounties())
        .catch(err => console.log(err))
      }
      return res
    })
    .then(res => res.json())
    .then((counties) => {
      this.setState({ counties: counties })
    })
  }

  refreshProperties = () => {
    this.setState({
      is_loading: true
    });

    const token = localStorage.getItem('token')
    if (!token) {
      this.fetchToken().then(() => this.refreshProperties())
      return
    }

    let url = apiUrl + "/properties";
    let query = "";
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
      query += "county=" + this.query.counties.map(county => county.name).join(',');
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
    const request = new Request(url)
    fetch(request, {mode: 'cors', headers: {
      'Authorization': `Bearer ${token}`
  }})
    .then(res => {
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        localStorage.removeItem('token')
        this.fetchToken()
        .then(() => this.refreshProperties())
        .catch(err => console.log(err))
      }
      return res
    })
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