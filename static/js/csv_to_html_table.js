var CsvToHtmlTable = CsvToHtmlTable || {};

CsvToHtmlTable = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-container";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table class='table is-bordered is-striped is-fullwidth' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var csvHeaderRow = csvData[0];

                var $tableHeadRow = $("<tr style='background:#1e293b; color:white;'></tr>");
                
                const explanations = [
                    "Model name", 
                    "Reference paper", 
                    "Model size",
                    "Number of frames",
                    "Outdoor accuracy",
                    "Shopping accuracy",
                    "Sport accuracy",
                    "Home accuracy",
                    "Show accuracy",
                    "Movie accuracy",
                    "Game accuracy",
                    "Level 1 accuracy",
                    "Level 2 accuracy",
                    "Level 3 accuracy",
                    "Overall accuracy"
                ];
                
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    var explanation = explanations[headerIdx] || "";
                    var $headerCell = $("<th style='color:white; text-align:center;'></th>").text(csvHeaderRow[headerIdx]);
                    $headerCell.attr('title', explanation);
                    $tableHeadRow.append($headerCell);
                }
                
                $tableHead.append($tableHeadRow);
                $table.append($tableHead);
                
                var $tableBody = $("<tbody></tbody>");
                var humanIndex = 0;
                var modelIndex = 0;

                for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                    var $tableBodyRow = $("<tr></tr>");
                    
                    // Color coding by section
                    if (csvData[rowIdx][0].includes("Expert") || csvData[rowIdx][0].includes("Human")) {
                        $tableBodyRow.css("background-color", "#f0f9ff");
                    } else if (csvData[rowIdx][0].includes("Gemini") || csvData[rowIdx][0].includes("GPT") || csvData[rowIdx][0].includes("Seed")) {
                        $tableBodyRow.css("background-color", "#eff6ff");
                    } else if (csvData[rowIdx][0].includes("Video-R1") || csvData[rowIdx][0].includes("VideoChat-R1") || csvData[rowIdx][0].includes("Thinking")) {
                        $tableBodyRow.css("background-color", "#f3e8ff");
                    } else {
                        $tableBodyRow.css("background-color", "#f0fdf4");
                    }
                    
                    for (var colIdx = 0; colIdx < csvData[rowIdx].length; colIdx++) {
                        var $tableBodyRowTd = $("<td></td>");
                        var cellValue = csvData[rowIdx][colIdx];
                        
                        // Left align for model name
                        if (colIdx == 0) {
                            $tableBodyRowTd.css("text-align", "left");
                            $tableBodyRowTd.css("font-weight", "500");
                        } else {
                            $tableBodyRowTd.css("text-align", "center");
                        }
                        
                        // Highlight best scores (only for numeric columns)
                        if (colIdx > 2 && colIdx < csvData[rowIdx].length && !isNaN(parseFloat(cellValue)) && rowIdx > 3) {
                            var colValues = [];
                            for (var checkIdx = 1; checkIdx < csvData.length; checkIdx++) {
                                var val = parseFloat(csvData[checkIdx][colIdx]);
                                if (!isNaN(val) && !csvData[checkIdx][0].includes("Human")) {
                                    colValues.push(val);
                                }
                            }
                            var maxVal = Math.max.apply(null, colValues);
                            if (parseFloat(cellValue) === maxVal && rowIdx > 3) {
                                $tableBodyRowTd.css("background-color", "#fef3c7");
                                $tableBodyRowTd.css("font-weight", "700");
                            }
                        }
                        
                        // Format numeric values
                        if (!isNaN(parseFloat(cellValue)) && cellValue !== "") {
                            $tableBodyRowTd.text(parseFloat(cellValue).toFixed(2));
                        } else {
                            $tableBodyRowTd.text(cellValue);
                        }
                        
                        $tableBodyRow.append($tableBodyRowTd);
                    }
                    $tableBody.append($tableBodyRow);
                }
                
                $table.append($tableBody);
                $table.DataTable(datatables_options);
                
                if (allow_download) {
                    $containerElement.append("<p style='margin-top:1rem;'><a class='button is-info is-small' href='" + csv_path + "' download><i class='fas fa-download'></i> Download as CSV</a></p>");
                }
            });
    }
};
