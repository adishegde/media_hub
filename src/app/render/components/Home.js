/* Home page component */
import React from "react";
import {
    Input,
    Grid,
    Segment,
    Select,
    Image,
    Button,
    Icon
} from "semantic-ui-react";

import Logo from "app/assets/Logo.png";
import SearchBar from "app/render/components/SearchBar";

export default class Home extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            search: "",
            param: "default"
        };

        this.onChange = this.onChange.bind(this);
        this.onSearch = this.onSearch.bind(this);
    }

    render() {
        let { search, param, searching } = this.state;

        return (
            <div className="home" style={{ height: "100%", width: "100%" }}>
                <Grid
                    textAlign="center"
                    style={{ height: "100%", width: "100%" }}
                    verticalAlign="middle"
                >
                    <Grid.Column style={{ maxWidth: "75%" }} stretched>
                        <Segment basic textAlign="center">
                            <Segment basic>
                                <Image src={Logo} size="medium" centered />
                            </Segment>
                            <SearchBar
                                search={search}
                                param={param}
                                onChange={this.onChange}
                                onSearch={this.onSearch}
                            />
                        </Segment>
                    </Grid.Column>
                </Grid>
            </div>
        );
    }

    onChange(e, { name, value }) {
        // Ensure name of input tags is same as the state properties
        this.setState({
            [name]: value
        });
    }

    onSearch() {
        let { search, param } = this.state;

        // Call onSearch prop with search string and param
        this.props.onSearch({
            search,
            param
        });
    }
}
