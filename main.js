// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
    // 2.a: FORMAT DATA
    data.forEach(d => {
        d.year = +d.year;
        d.name = d.fullname;
    });

    // 3.a: Group into STEM vs Non-STEM
    const stemFields = ["physics", "chemistry", "medicine", "economics"];
    const categorizedData = data.map(d => ({
        ...d,
        categoryGroup: stemFields.includes(d.category.toLowerCase()) ? "STEM" : "Non-STEM"
    }));

    // 3.b: Group and count laureates per year per category group
    const categories = d3.rollup(
        categorizedData,
        v => d3.rollup(v, v2 => v2.length, d => d.year),
        d => d.categoryGroup
    );

    // 4.a: X SCALE
    const allYears = Array.from(categories.values()).flatMap(yearMap => Array.from(yearMap.keys()));
    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([0, width]);

    // 4.b: Y SCALE
    const yearCounts = Array.from(categories.values()).map(yearMap => Array.from(yearMap.values()));
    const maxCount = d3.max(yearCounts, yearValues => d3.max(yearValues));
    const yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([height, 0]);

    // 4.c: COLOR SCALE
    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(categories.keys()))
        .range(d3.schemeCategory10);

    // 4.d: LINE GENERATOR
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));

    // 5: PLOT LINES
    const dataArray = Array.from(categories.entries());
    svgLine.selectAll("path")
        .data(dataArray)
        .enter()
        .append("path")
        .attr("d", d => {
            const values = Array.from(d[1].entries()).map(([year, count]) => ({ year, count }));
            return line(values);
        })
        .style("stroke", d => colorScale(d[0]))
        .style("fill", "none")
        .style("stroke-width", 2);

    // 6: ADD AXES
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // 7: ADD LABELS
    svgLine.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .text("Nobel Laureates Over Time: STEM vs Non-STEM");

    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 1.5)
        .attr("text-anchor", "middle")
        .text("Year");

    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 1.5)
        .attr("text-anchor", "middle")
        .text("Number of Laureates");

    // 8: LEGEND
    const legend = svgLine.selectAll(".legend")
        .data(dataArray)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width - 150}, ${i * 20 - 30})`);

    legend.append("rect")
        .attr("x", 10)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", d => colorScale(d[0]));

    legend.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .text(d => d[0]);
});
