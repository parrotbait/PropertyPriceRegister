import React, { Component } from 'react';
import { DropdownButton, Dropdown } from 'react-bootstrap'
  
export default class CountiesDropdown extends Component {
    
    constructor(props, context) {
        super(props, context);
        this.state = { selected: [] };
    }
    
    onCountySelected = (e) => {
      const county = this.props.counties[e]
      const selected = this.state.selected
      const index = selected.indexOf(county.id)
      if (index !== -1) {
          selected.splice(index, 1);
      } else {
          selected.push(county.id)
      }
      const selectedCounties = this.props.counties.filter(x => selected.indexOf(x.id) !== -1)
      this.props.onCountiesSelected(selectedCounties)
    }

    getSelectedCounties = () => {
      return this.props.counties.filter((county, index) => {
        return this.state.selected.indexOf(county.id) !== -1
      }).map(county => {
        return county.name
      })
    }
  
    outputCounties = () => {
        return this.props.counties.map((county, index) => {
            if (this.state.selected.indexOf(county.id) !== -1)  {
                return <Dropdown.Item key={index} eventKey={index} id={index} active as="button">{county.name}</Dropdown.Item>
            } 
            return <Dropdown.Item key={index} eventKey={index} id={index} as="button">{county.name}</Dropdown.Item>
          })
    }

    getTitle = () => {
      const counties = this.getSelectedCounties()
      if (counties.length === 0) {
        return "Select"
      }
      return counties.join(", ")
    }

    render() {
      return (
        <DropdownButton id="dropdown-item-button" className="justify-content-end" onSelect={this.onCountySelected} title={this.getTitle()}>
            <Dropdown.Menu>
                {this.outputCounties()} 
            </Dropdown.Menu>
        </DropdownButton>
      );
    }
}