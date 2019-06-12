let RegularTile = class
    {
    constructor(name,parent, color, number_of_sides, desired_angle, neighbors = [])
        {
        this.name = name;
        this.parent = parent;
        this.color = color;
        this.number_of_sides = number_of_sides;
        this.angle = desired_angle;
        this.neighbors = neighbors;
        }

    generate_shape_values(coords, sidelength, number_of_sides_current, first_shape = false)
    {
        <!-- Takes an origin, a direction, the sidelength. Returns the xy coordinates and radius of the new polygon -->

        var old_radii = get_shape_radii(sidelength, number_of_sides_current);
        var shape_angle;

        <!-- Use the inner radii of both shapes to calculate the vector for where the new shape will lie, then add it to existing coords  -->
        if (!first_shape)
        {
            var new_radii = get_shape_radii(sidelength, this.number_of_sides);
            var new_coords = add_directional_vector(coords, this.angle, old_radii[0]+new_radii[0]);
            shape_angle = get_modified_shape_angle(this.angle, this.number_of_sides);
            return {"x":new_coords[0], "y":new_coords[1], "radius":new_radii[1], "angle":shape_angle, "sides":this.number_of_sides, "color":this.color};
        }
        else
        {
            shape_angle = get_modified_shape_angle(this.angle, number_of_sides_current);
            return {"x":coords[0], "y":coords[1],"radius":old_radii[1], "angle":shape_angle, "sides":this.number_of_sides, "color":this.color};
        }
    }

    toString()
    {
        return this.name + " " +
        this.parent + " " +
        this.color + " " +
        this.number_of_sides + " " +
        this.angle + " " +
        this.neighbors.toString();
    }
    };

function get_outer_radius(sidelength, number_of_sides)
{
    return sidelength / (2 * Math.sin(Math.PI / number_of_sides))
}

function get_inner_radius(radius, sidelength)
{
    /* Gets the inner radius(center to sides) of a regular polygon using pythagorean theorem*/
    return Math.sqrt((radius * radius) - (sidelength * sidelength / 4))
}

function get_shape_radii(sidelength, number_of_sides)
{
    /* 	Get both the inner and outer radii of a regular polygon
        First use the sidelength and number of sides to get the outer radius
        Then use the outer radius and sidelength to get the inner radius	*/
    var outer_radius = get_outer_radius(sidelength, number_of_sides);
    var inner_radius = get_inner_radius(outer_radius, sidelength);
    return [inner_radius, outer_radius]
}

function polar_to_cartesian(direction, magnitude) {
    /* creates an x,y vector given a direction(degrees) and a magnitude */
    var dir = direction
    var x = magnitude * Math.cos((dir / 360) * 2 * Math.PI)
    var y = magnitude * Math.sin((dir / 360) * 2 * Math.PI)
    return [x, y]
}

function point_direction(coord1, coord2) {
    <!-- returns the angle in degrees from two coordinates -->
    var dy = coord2[1] - coord1[1]
    var dx = coord2[0] - coord1[0]
    var a = Math.atan2(dy, dx);
    while (a < 0.0)
        a += math.pi * 2;

    return a * 180 / Math.PI
}

function add_directional_vector(coords, direction, magnitude)
{
    /* Takes [x,y] adds a vector to it and returns the new [x,y] */
    var vector = polar_to_cartesian(direction,magnitude)
    return [coords[0] + vector[0], coords[1] + vector[1]]
}

function get_modified_shape_angle(direction, number_of_sides)
{
    <!-- Gives an angular offset value for drawing polygons. Even numbered shapes have an offset while odd doesn't  -->
    return direction + ((number_of_sides % 2) == 0 ? (360 / (number_of_sides * 2)) : 0)
}

function generate_initial_chunk_data(sidelength, shapes, origin_tile, horizontal_tile, vertical_tile)
{
    var chunk_data = {};

    /* Generates all data needed to render a chunk
     * Removes horizontal and vertical tiles as they are only meant to be temporary to calculate chunk's dimensions */

    var current_number_of_sides;
    if (shapes.length > 2)
    {
        var current_number_of_sides = shapes[0].number_of_sides;

        /* Generate values of first shape in the sequence */
        var polygon_values = shapes[0].generate_shape_values([0,0], sidelength, current_number_of_sides, true);

        /* add rendering data to chunk */
        chunk_data["tiles"] = {};
        chunk_data["tiles"][shapes[0].name] = polygon_values;

        for (var i = 1; i < shapes.length; i++)
        {
            /* Feed coordinates and number of sides of the parent of current shape back into function*/
            var parent = shapes[i].parent;

            var coords = [chunk_data["tiles"][parent]["x"]	, chunk_data["tiles"][parent]["y"]]
            current_number_of_sides = chunk_data["tiles"][parent]["sides"];

            polygon_values = shapes[i].generate_shape_values(coords, sidelength, current_number_of_sides, false);

            /* add rendering data to chunk */
            chunk_data["tiles"][shapes[i].name] = polygon_values;
        }

        var chunk_width = chunk_data["tiles"][horizontal_tile]["x"] - chunk_data["tiles"][origin_tile]["x"];
        var chunk_height = chunk_data["tiles"][vertical_tile]["y"] - chunk_data["tiles"][origin_tile]["y"];

        chunk_data["chunk_width"] = chunk_width;
        chunk_data["chunk_height"] = chunk_height;

        delete chunk_data["tiles"][horizontal_tile];
        delete chunk_data["tiles"][vertical_tile];
    }
    else
    {
        alert("At least 3 tiles required for chunk calculations")
    }
    return chunk_data;
}

function render_chunks(xoffset, yoffset, chunk_horizontal_count, chunk_vertical_count, canvas, chunk_data, chunk_seperation_distance = 0)
{
    /* Renders chunks to the canvas */
    var x = xoffset;
    var y = yoffset;

    for(var i = 0; i < chunk_vertical_count; i++)
    {
        for(var j = 0; j < chunk_horizontal_count; j++)
        {
            /* Render all the tiles in a single chunk */
            for (var [name, shape_data] of Object.entries(chunk_data["tiles"]))
            {
                polygon = new createjs.Shape();
                polygon.graphics.beginFill(shape_data["color"]).drawPolyStar(shape_data["x"]+x, shape_data["y"]+y, shape_data["radius"], shape_data["sides"], 0, shape_data["angle"]);
                canvas.addChild(polygon);
            }
            x += chunk_data["chunk_width"] + chunk_seperation_distance;
        }
        y += chunk_data["chunk_height"] + chunk_seperation_distance;
        x = xoffset;
    }

    canvas.update()
}

function string_to_shape_data(input_string)
{
    var shape_data = [];
    return
}

function init()
{
    var sidelength = 20;
    var stage = new createjs.Stage("demoCanvas");

    /* shape("name","color",sides, angle, neighbors=[]) */
    shape_data = [
        new RegularTile("A",null, "blue", 6, 0, []),
        new RegularTile("B","A", "orange", 4, 180, []),
        new RegularTile("C","B", "red", 3, 90, []),
        new RegularTile("D","C", "orange", 4, 30, []),
        new RegularTile("E","D", "red", 3, 30, []),
        new RegularTile("F","A", "orange", 4, 60, []),
        new RegularTile("G","F", "blue", 6, 60, []),
        new RegularTile("H","G", "orange", 4, 180, []),
        new RegularTile("I","H", "red", 3, 90, []),
        new RegularTile("J","I", "orange", 4, 30, []),
        new RegularTile("K","J", "red", 3, 30, []),
        new RegularTile("L","G", "orange", 4, 60, []),

        new RegularTile("M","L", "blue", 6, 60, []),
        new RegularTile("N","J", "blue", 6, 120, []),
    ];

    chunk_data = generate_initial_chunk_data(sidelength, shape_data, "A", "M", "N");

    chunk_vertical_count = 4;
    chunk_horizontal_count = 8;

    render_chunks(30,30,chunk_horizontal_count, chunk_vertical_count, stage, chunk_data, 0);
}

function input_to_chunk_generation()
{
    var shape_input = JSON.parse(document.getElementById("shape_input").value);
    var shape_data = [];

    for(var i = 0; i < shape_input.length; i++)
    {
        var shape = shape_input[i];
        shape_data.push(new RegularTile(shape[0],shape[1],shape[2],shape[3],shape[4]))
    }

    var origin_shape = shape_input[0][0];
    var horizontal_shape = shape_input[shape_input.length - 2][0];
    var vertical_shape = shape_input[shape_input.length - 1][0];

    var chunk_data = generate_initial_chunk_data(20, shape_data, origin_shape, horizontal_shape, vertical_shape);

    document.getElementById("chunk_data").value = JSON.stringify(chunk_data);

    var stage = new createjs.Stage("demoCanvas");
    render_chunks(60,60, 3, 3, stage, chunk_data, 0);

}