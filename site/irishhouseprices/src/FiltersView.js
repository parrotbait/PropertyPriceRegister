
import './App.css';
import React, { Component } from 'react';
import { Col, Button, Dropdown, Row, Container, Form, DropdownButton, Modal } from 'react-bootstrap'
import CountiesDropdown from './CountiesDropdown'
import { SingleDatePicker } from 'react-dates';
import * as Price from './Price'
import {isMobile} from 'react-device-detect';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
var moment = require('moment');

let defaultStartDate = '2018-07-01'
let defaultEndtDate = '2020-12-01'

export default class FiltersView extends Component {
      

  constructor(props, context) {
    super(props, context);
    this.state = { selected: [],
      start_date_focussed: false,
      end_date_focussed: false,
      query: {
        text: '',
        counties: [],
        minPrice: null,
        maxPrice: null,
        startDate: defaultStartDate,
        endDate: defaultEndtDate
      },
      counties: []};
  }

  componentDidMount() {
    this.onTextEntered = this.onTextEntered.bind(this)
  }

  clearFilters = () => {
    this.setState(() => ({
      start_date_focussed: false,
      end_date_focussed: false,
      query: {
        text: '',
        counties: [],
        minPrice: null,
        maxPrice: null,
        startDate: defaultStartDate,
        endDate: defaultEndtDate
      }}))
  }

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
      }))
  };

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
  }


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
    }))
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
    }))
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
    }))
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
    }))
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

  render() {
    return <Modal centered show={this.props.visible} className="filter_card" onHide={() => this.props.closeClicked()}>
    <Modal.Header closeButton>
      <Modal.Title>Search Filters</Modal.Title>
    </Modal.Header>
    <Modal.Body>  
      <Container>
        <Row>
          <Col xs={3}>Address: </Col>
          <Col>
            <Form.Control type="input" placeholder="Search address" value={this.state.query.text} onChange={this.onTextEntered} />
          </Col>
        </Row>
        <Row className="mt-2">
          <Col xs={3}>County</Col>
          <Col className="justify-content-end">
            <CountiesDropdown 
              counties={this.props.counties}
              onCountiesSelected={this.onCountiesSelected}
              className="p-0 m-0"
              />
          </Col>
        </Row>
        <Row className="mt-2">
          <Col>
            <Row className="justify-content-center">Start date</Row>
            <Row className="justify-content-center">
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
                className="p-0 m-0"
                displayFormat="DD/MM/YYYY"
                id="filter-start-date" // PropTypes.string.isRequired,
            />
            </Row>
          </Col>
          <Col>
            <Row className="justify-content-center">End date</Row>
            <Row className="justify-content-center">
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
                className="p-0 m-0"
                displayFormat="DD/MM/YYYY"
                id="filter-end-date" // PropTypes.string.isRequired,
              />
            </Row>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <Row className="justify-content-center">
              Min Price
            </Row>
            <Row className="justify-content-center">
              <DropdownButton 
                    title={this.state.query.minPrice || "Select"}
                    id={`dropdown-variants-min-price`}
                    key='min-price'
                    onSelect={this.onMinPriceSelected}
                    className="p-0 m-0"
                  >
                {this.getDropdownOptions(this.state.query.minPrice)}
              </DropdownButton>
            </Row>
          </Col>
          <Col>
            <Row className="justify-content-center">Max Price</Row>
            <Row className="justify-content-center">
              <DropdownButton 
                title={this.state.query.maxPrice || "Select"}
                id={`dropdown-variants-max-price`}
                key='max-price'
                onSelect={this.onMaxPriceSelected}
                className="p-0 m-0"
              >
                {this.getDropdownOptions(this.state.query.maxPrice)}
              </DropdownButton>
            </Row>
          </Col>
        </Row>
        <Row className="mt-3 justify-content-center">
          <Button variant="secondary" onClick={() => this.clearFilters()}>Clear</Button>
          <Button variant="primary" onClick={() => this.props.onFiltersApplied(this.state.query)}>Search</Button>
        </Row>
      </Container>
    </Modal.Body>
  </Modal>
  }
}