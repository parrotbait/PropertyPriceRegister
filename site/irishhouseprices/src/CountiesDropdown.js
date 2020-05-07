import React, { Component } from 'react';
import { DropdownButton, Dropdown } from 'react-bootstrap'
  
export default class CountiesDropdown extends Component {
    
    constructor(props, context) {
        super(props, context);
        this.state = { selected: [] };
    }
    
    onCountySelected = (e) => {
        let county = this.props.counties[e]
        let selected = this.state.selected
        let index = selected.indexOf(county.id)
        if (index !== -1) {
            selected.splice(index, 1);
        } else {
            selected.push(county.id)
        }
        let selectedCounties = this.props.counties.filter(x => selected.indexOf(x.id) !== -1)
        this.props.onCountiesSelected(selectedCounties)
    }

    state = {
      };
  
    outputCounties = () => {
        return this.props.counties.map((county, index) => {
            if (this.state.selected.indexOf(county.id) !== -1)  {
                return <Dropdown.Item key={index} eventKey={index} id={index} active as="button">{county.name}</Dropdown.Item>
            } 
            return <Dropdown.Item key={index} eventKey={index} id={index} as="button">{county.name}</Dropdown.Item>
          })
    }
    render() {
    return (
        <DropdownButton id="dropdown-item-button" onSelect={this.onCountySelected} title="Select">
            <Dropdown.Menu onSelect={function(e){alert(e);}}>
                {this.outputCounties()} 
            </Dropdown.Menu>
        </DropdownButton>
      );
    }
}