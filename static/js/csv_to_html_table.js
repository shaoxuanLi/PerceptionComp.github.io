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

        var $table = $("<table class='table is-bordered is-fullwidth' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        // Model family detection and color config
        function getFamily(name) {
            if (name.includes("Expert") || name.includes("Human")) return "human";
            if (name.includes("Thinking"))                          return "thinking";
            if (name.includes("Gemini"))                            return "gemini";
            if (name.includes("GPT") || name.includes("Seed"))      return "gpt";
            return "opensource";
        }

        var familyStyle = {
            "human":      { bg: "#f0fdf4", bar: "#16a34a", border: "#86efac", label: "Human" },
            "gemini":     { bg: "#eff6ff", bar: "#2563eb", border: "#93c5fd", label: "Gemini" },
            "gpt":        { bg: "#fff7ed", bar: "#ea580c", border: "#fdba74", label: "GPT / Seed" },
            "thinking":   { bg: "#faf5ff", bar: "#9333ea", border: "#d8b4fe", label: "Thinking" },
            "opensource": { bg: "#f8fafc", bar: "#64748b", border: "#cbd5e1", label: "Open-source" }
        };

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
                    var $headerCell = $("<th style='color:white; text-align:center; white-space:nowrap;'></th>").text(csvHeaderRow[headerIdx]);
                    if (headerIdx === csvHeaderRow.length - 1) {
                        $headerCell.css("background", "#1d4ed8");
                    }
                    $headerCell.attr('title', explanation);
                    $tableHeadRow.append($headerCell);
                }

                $tableHead.append($tableHeadRow);
                $table.append($tableHead);

                // Pre-compute per-column max for model rows (skip first 3 human rows)
                var numCols = csvData[0].length;
                var colMaxVals = {};
                for (var ci = 4; ci < numCols; ci++) {
                    var vals = [];
                    for (var ri = 4; ri < csvData.length; ri++) {
                        var v = parseFloat(csvData[ri][ci]);
                        if (!isNaN(v)) vals.push(v);
                    }
                    colMaxVals[ci] = vals.length > 0 ? Math.max.apply(null, vals) : 0;
                }

                var $tableBody = $("<tbody></tbody>");

                for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                    var modelName = csvData[rowIdx][0];
                    var family = getFamily(modelName);
                    var fStyle = familyStyle[family];

                    var $tableBodyRow = $("<tr></tr>");
                    $tableBodyRow.css({
                        "background-color": fStyle.bg,
                        "border-left": "4px solid " + fStyle.border
                    });

                    for (var colIdx = 0; colIdx < csvData[rowIdx].length; colIdx++) {
                        var $td = $("<td style='vertical-align:middle;'></td>");
                        var cellValue = csvData[rowIdx][colIdx];

                        if (colIdx === 0) {
                            // Model name cell
                            $td.css({ "text-align": "left", "font-weight": "500", "padding-left": "10px" });
                            $td.text(cellValue);
                        } else if (colIdx >= 4 && cellValue !== "" && !isNaN(parseFloat(cellValue))) {
                            // Numeric accuracy cell — add progress bar
                            var numVal = parseFloat(cellValue);
                            var barPct = Math.min(numVal, 100);
                            var isOverallCol = (colIdx === numCols - 1);

                            // Highlight best model score (excluding human rows, colIdx>=4)
                            var isBest = (rowIdx > 3 && colMaxVals[colIdx] !== undefined && numVal === colMaxVals[colIdx]);
                            if (isBest) {
                                $td.css({ "background-color": "#fef3c7", "font-weight": "700" });
                            }
                            if (isOverallCol) {
                                $td.css("font-weight", "600");
                            }

                            var barColor = isBest ? "#d97706" : fStyle.bar;
                            var cellHtml =
                                '<div style="position:relative; padding-bottom:5px; min-width:46px; text-align:center;">' +
                                  '<span style="font-size:0.83rem;">' + numVal.toFixed(2) + '</span>' +
                                  '<div style="position:absolute;bottom:0;left:0;height:3px;width:' + barPct + '%;' +
                                       'background:' + barColor + ';border-radius:0 2px 2px 0;opacity:0.7;"></div>' +
                                '</div>';
                            $td.html(cellHtml);
                            $td.css("padding", "6px 6px 8px 6px");
                        } else {
                            $td.css("text-align", "center");
                            $td.text(cellValue);
                        }

                        $tableBodyRow.append($td);
                    }
                    $tableBody.append($tableBodyRow);
                }

                $table.append($tableBody);
                $table.DataTable(datatables_options);

                // Append color legend
                var legendHtml = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:1rem;justify-content:center;">';
                $.each(familyStyle, function(key, s) {
                    legendHtml += '<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;color:#374151;">' +
                        '<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:' + s.bg + ';border:2px solid ' + s.border + ';"></span>' +
                        s.label + '</span>';
                });
                legendHtml += '</div>';
                $containerElement.append(legendHtml);

                if (allow_download) {
                    $containerElement.append("<p style='margin-top:1rem;'><a class='button is-info is-small' href='" + csv_path + "' download><i class='fas fa-download'></i> Download as CSV</a></p>");
                }
            });
    }
};
