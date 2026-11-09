sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "com/nhpc/zhriepfs1/utils/messenger",
    "com/nhpc/zhriepfs1/utils/formatter",
    "sap/ui/core/BusyIndicator"
], (Controller, Filter, FilterOperator, Spreadsheet, messenger, Formatter, BusyIndicator) => {
    "use strict";

    return Controller.extend("com.nhpc.zhriepfs1.controller.Dashboard", {
        formatter: Formatter,
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var sTransactionId = oArgs.TransactionId;
            var oViewModel = this.getView().getModel("viewModel");
            oViewModel.setProperty("/TransactionId", sTransactionId);
            this.getView().getModel("sharesModel").setProperty("/data", []);
            this.getView().getModel("dividendModel").setProperty("/data", []);
            if (sTransactionId) {
                this.getTransactionDetails(sTransactionId);
            } else {
                if (!oViewModel.getProperty("/selectedType")) {
                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                } else {
                    this.byId("objPageHeader").setText(this.getResourceBundle().getText("iepfRequestPage"));
                    this.byId("objPageHeader1").setText(this.getResourceBundle().getText("iepfRequestPage"));
                    this.getDefaultEmployeeDetails();
                }
            }
        },

        getDefaultEmployeeDetails: function () {
            var oModel = this.getView().getModel(),
                oViewModel = this.getView().getModel("viewModel");
            BusyIndicator.show(0);
            oViewModel.setProperty("/TransactionId", "");
            oModel.read("/ZHCM_CDS_IEPF_EMPLOGGEDINFO", {
                success: function (oResp) {
                    BusyIndicator.hide();
                    if (oResp.results && oResp.results.length > 0) {
                        var oViewModel = this.getView().getModel("viewModel");
                        oViewModel.setProperty("/requestDetails/EmployeeId", oResp.results[0].PERNR);
                        oViewModel.setProperty("/requestDetails/EmployeeName", oResp.results[0].ENAME);
                        oViewModel.setProperty("/requestDetails/CompanyCode", oResp.results[0].BUKRS);
                        oViewModel.setProperty("/requestDetails/EmployeeGrade", oResp.results[0].GRADE_CODE);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrp", oResp.results[0].SUB_GROUP);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrpText", oResp.results[0].SUB_GROUP_TEXT);
                        oViewModel.setProperty("/requestDetails/PersonnelSubArea", oResp.results[0].SUB_AREA);
                        oViewModel.setProperty("/requestDetails/PersonnelSubAreaText", oResp.results[0].SUB_AREA_TEXT);
                        oViewModel.setProperty("/requestDetails/Department", oResp.results[0].DEP_CODE);
                        oViewModel.setProperty("/requestDetails/PositionText", oResp.results[0].DESIG);

                        var oRespData = $.extend(true, {}, oResp.results[0]);
                        // this.setTransactionData(oRespData);
                    }
                }.bind(this),
                error: function (oError) {
                    BusyIndicator.hide();
                    messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                        this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                    }.bind(this));
                }.bind(this)
            })
        },

        getTransactionDetails: function (sTransactionId) {
            var oModel = this.getView().getModel(),
                oViewModel = this.getView().getModel("viewModel"),
                aFilters = [];

            BusyIndicator.show(0);
            aFilters.push(new Filter("TransId", FilterOperator.EQ, sTransactionId));
            oModel.read(`/ZHCM_CDS_IEPF_HEADER('${sTransactionId}')`, {
                // filters: aFilters,
                urlParameters: {
                    "$expand": "to_share,to_dividend"
                },
                success: function (oResp) {
                    BusyIndicator.hide();
                    if (oResp) {
                        oViewModel.setProperty("/selectedType", oResp.Uploadtype);
                        // Start of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
                        let selectedType = oResp.Uploadtype;
                        if (selectedType === "D") {
                            oViewModel.setProperty("/finYear", oResp.Finyr);
                        }
                        if (selectedType === "S") {
                            oViewModel.setProperty("/monthYear", oResp.Formonyear);
                        }
                        // End of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
                        oViewModel.setProperty("/requestDetails/Status", oResp.Status);
                        oViewModel.setProperty("/requestDetails/StatusText", oResp.Statustext);
                        oViewModel.setProperty("/requestDetails/EmployeeId", oResp.Empid);
                        oViewModel.setProperty("/requestDetails/EmployeeName", oResp.Empname);
                        oViewModel.setProperty("/requestDetails/CompanyCode", oResp.Compcode);
                        oViewModel.setProperty("/requestDetails/EmployeeGrade", oResp.Empgradecode);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrp", oResp.Empsubgrp);
                        oViewModel.setProperty("/requestDetails/EmployeeSubgrpText", oResp.Empsubgrptxt);
                        oViewModel.setProperty("/requestDetails/PersonnelSubArea", oResp.Empsubarea);
                        oViewModel.setProperty("/requestDetails/PersonnelSubAreaText", oResp.Empsubareatext);
                        oViewModel.setProperty("/requestDetails/Department", oResp.Empdept);
                        oViewModel.setProperty("/requestDetails/PositionText", oResp.Empposition);
                        oViewModel.setProperty("/submitType", oResp.Status)
                        this.byId("objPageHeader").setText(this.getResourceBundle().getText("createdIEPFRequest", [sTransactionId]));
                        this.byId("objPageHeader1").setText(this.getResourceBundle().getText("createdIEPFRequest", [sTransactionId]));
                        var oRespData = $.extend(true, {}, oResp);
                        this.setTransactionData(oRespData);
                    }
                }.bind(this),
                error: function (oError) {
                    BusyIndicator.hide();
                    messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                        this.getRouter().navTo("RouteDashboard", {}, {}, true);
                    }.bind(this));
                }.bind(this)
            });

        },

        getResourceBundle: function () {
            return this.getOwnerComponent()
                .getModel("i18n")
                .getResourceBundle();
        },

        processUploadedData: function (data, sheetName) {
            const oViewModel = this.getView().getModel("viewModel");
            const oResourceBundle = this.getResourceBundle();
            const selectedType = oViewModel.getProperty("/selectedType");
            if (!data || data.length === 0) {
                messenger.error(oResourceBundle.getText("noDataFoundInFileMsg"));
                return;
            }
            let columnMapping = {};
            if (sheetName === "IEPFSharesList") {
                columnMapping = {
                    "DP-ID": "Invdpid",
                    "Client ID": "Invclientid",
                    "Folio Number": "Invfolionumber",
                    "Investor First Name": "Invfname",
                    "Investor Middle Name": "Invsmname",
                    "Investor Last Name": "Invlname",
                    "Father/Husband First Name": "Invfhfname",
                    "Father/Husband Middle Name": "Invfhmname",
                    "Father/Husband Last Name": "Invfhlname",
                    "Address": "Invaddress",
                    "Country": "Invcountry",
                    "State": "Invstate",
                    "District": "Invdistrict",
                    "PIN Code": "Invpincode",
                    "Number of Shares": "Invnoofshares",
                    "Nominal Value of Shares": "Invnominalvalueofshare",
                    "Actual Date of Transfer to IEPF": "Invdateofsharetransfer2iepf"
                };
            } else if (sheetName === "IEPFDividendList") {
                columnMapping = {
                    "DP-ID": "Invdpid",
                    "Client ID": "Invclientid",
                    "Folio Number": "Invfolionumber",
                    "Investor First Name": "Invfname",
                    "Investor Middle Name": "Invsmname",
                    "Investor Last Name": "Invlname",
                    "Father/Husband First Name": "Invfhfname",
                    "Father/Husband Middle Name": "Invfhmname",
                    "Father/Husband Last Name": "Invfhlname",
                    "Address": "Invaddress",
                    "Country": "Invcountry",
                    "State": "Invstate",
                    "District": "Invdistrict",
                    "PIN Code": "Invpincode",
                    "Investment Type": "Investmenttype",
                    "Amount Transferred": "Invamounttransfered",
                    "Date of Event": "Invdateofevent"
                };
            }
            const requiredColumns = [
                // "DP-ID Client-ID Account Number",
                // "Folio Number"
            ];
            const invalidRows = [];
            data.forEach(function (row, index) {
                const missingFields = requiredColumns.filter(function (column) {
                    return row[column] == null ||
                        String(row[column]).trim() === "";
                });
                if (missingFields.length > 0) {
                    invalidRows.push(
                        `${oResourceBundle.getText("row")}${index + 2}: ${missingFields.join(", ")}`
                    );
                }
            });
            if (invalidRows.length > 0) {
                messenger.error(
                    oResourceBundle.getText("missingRequiredFieldsMsg") +
                    invalidRows.join("\n")
                );
                return;
            }
            const mappedData = data.map(function (row) {
                const newRow = {};
                Object.keys(columnMapping).forEach(function (excelColumn) {
                    const backendField = columnMapping[excelColumn];
                    const value = row[excelColumn];
                    newRow[backendField] =
                        value == null ? "" : String(value);
                });
                return newRow;
            });
            this._uploadedData = mappedData;
            if (selectedType === "S") {
                const oModel = this.getView().getModel("sharesModel");
                oModel.setProperty("/data", mappedData);
                const oTable = this.byId("idSharesTable");
                const oRowMode = oTable.getRowMode();
                if (mappedData.length > 0) {
                    oRowMode.setRowCount(Math.min(mappedData.length, 5));
                }
            } else if (selectedType === "D") {
                const oModel = this.getView().getModel("dividendModel");
                oModel.setProperty("/data", mappedData);

                const oTable = this.byId("idDividendTable");
                const oRowMode = oTable.getRowMode();

                if (mappedData.length > 0) {
                    oRowMode.setRowCount(Math.min(mappedData.length, 5));
                }
            }
            messenger.success(
                mappedData.length + " " +
                oResourceBundle.getText("recordsUploadedSuccessfullyMsg")
            );
            oViewModel.refresh(true);
        },

        onDownload: function () {
            const sSelectedType = this.getView().getModel("viewModel").getProperty("/selectedType");
            const oResourceBundle = this.getResourceBundle();
            let aData = [];
            let aColumns = [];
            if (sSelectedType === "S") {
                aData = this.getView().getModel("sharesModel").getProperty("/data");
                aColumns = [
                    { label: oResourceBundle.getText("dpIdClientIdAccountNumber"), property: "Invdpidclientidaccntnum" },
                    { label: oResourceBundle.getText("folioNumber"), property: "Invfolionumber" },
                    { label: oResourceBundle.getText("investorFirstName"), property: "Invfname" },
                    { label: oResourceBundle.getText("investorMiddleName"), property: "Invsmname" },
                    { label: oResourceBundle.getText("investorLastName"), property: "Invlname" },
                    { label: oResourceBundle.getText("fatherHusbandFirstName"), property: "Invfhfname" },
                    { label: oResourceBundle.getText("fatherHusbandMiddleName"), property: "Invfhmname" },
                    { label: oResourceBundle.getText("fatherHusbandLastName"), property: "Invfhlname" },
                    { label: oResourceBundle.getText("address"), property: "Invaddress" },
                    { label: oResourceBundle.getText("country"), property: "Invcountry" },
                    { label: oResourceBundle.getText("state"), property: "Invstate" },
                    { label: oResourceBundle.getText("district"), property: "Invdistrict" },
                    { label: oResourceBundle.getText("pinCode"), property: "Invpincode" },
                    { label: oResourceBundle.getText("numberOfShares"), property: "Invnoofshares" },
                    { label: oResourceBundle.getText("nominalValueOfShares"), property: "Invnominalvalueofshare" },
                    { label: oResourceBundle.getText("actualDateOfTransferToIEPF"), property: "Invdateofsharetransfer2iepf" }
                ];
            } else {
                aData = this.getView().getModel("dividendModel").getProperty("/data");
                aColumns = [
                    { label: oResourceBundle.getText("dpIdClientIdAccountNumber"), property: "Invdpidclientidaccntnum" },
                    { label: oResourceBundle.getText("folioNumber"), property: "Invfolionumber" },
                    { label: oResourceBundle.getText("investorFirstName"), property: "Invfname" },
                    { label: oResourceBundle.getText("investorMiddleName"), property: "Invsmname" },
                    { label: oResourceBundle.getText("investorLastName"), property: "Invlname" },
                    { label: oResourceBundle.getText("fatherHusbandFirstName"), property: "Invfhfname" },
                    { label: oResourceBundle.getText("fatherHusbandMiddleName"), property: "Invfhmname" },
                    { label: oResourceBundle.getText("fatherHusbandLastName"), property: "Invfhlname" },
                    { label: oResourceBundle.getText("address"), property: "Invaddress" },
                    { label: oResourceBundle.getText("country"), property: "Invcountry" },
                    { label: oResourceBundle.getText("state"), property: "Invstate" },
                    { label: oResourceBundle.getText("district"), property: "Invdistrict" },
                    { label: oResourceBundle.getText("pinCode"), property: "Invpincode" },
                    { label: oResourceBundle.getText("investmentType"), property: "Investmenttype" },
                    { label: oResourceBundle.getText("amountTransferred"), property: "Invamounttransfered" },
                    { label: oResourceBundle.getText("dateOfEvent"), property: "Invdateofevent" }
                ];
            }
            if (!aData || !aData.length) {
                messenger.error(oResourceBundle.getText("noDataToDownloadMsg"));
                return;
            }
            const oSettings = {
                workbook: {
                    columns: aColumns,
                    context: {
                        sheetName: sSelectedType === "S" ? oResourceBundle.getText("sharesSheetName") : oResourceBundle.getText("dividendSheetName")
                    }
                },
                dataSource: aData,
                fileName: sSelectedType === "S" ? oResourceBundle.getText("sharesTemplateDownloadReportFileName") : oResourceBundle.getText("dividendTemplateDownloadReportFileName")
            };
            const oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
            });
        },

        handleInterimSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                bProceed = this.validateSubmitRequestDetails(),
                sText = oResourceBundle.getText("CONFIRM_TEXT_INTERIM_REQUEST");
            this.sActionFlag = "Interim";
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    var oModel = this.getView().getModel(),
                        oPayload = this.createRequestPayload();
                    oModel.create("/ZHCM_CDS_IEPF_HEADER", oPayload, {
                        success: function (oResp) {
                            if (oResp.TRANS_ID) {
                                this.TRANS_ID = oResp.TRANS_ID;
                                BusyIndicator.hide();
                                messenger.success(oResourceBundle.getText("iepfRequestInterimSuccessMsg", oResp.TRANS_ID), () => {
                                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                                });
                            }
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },

        createRequestPayload: function () {
            var oViewModel = this.getView().getModel("viewModel"),
                oRequestDetails = oViewModel.getProperty("/requestDetails"),
                oShareModel = this.getView().getModel("sharesModel"),
                oDividendModel = this.getView().getModel("dividendModel"),
                oSharesData = oShareModel.getProperty("/data"),
                oDividendData = oDividendModel.getProperty("/data");
            var oPayload = {
                Uploadtype: oViewModel.getProperty("/selectedType"),
                // Status: this.sActionFlag === "Interim" ? "01" : "02",
                Status: oViewModel.getProperty("/submitType") === "01" ? "01" : "02",
                Empid: oRequestDetails.EmployeeId,
                Empname: oRequestDetails.EmployeeName,
                Compcode: oRequestDetails.CompanyCode,
                Empgradecode: oRequestDetails.EmployeeGrade,
                Empsubgrp: oRequestDetails.EmployeeSubgrp,
                Empsubgrptxt: oRequestDetails.EmployeeSubgrpText,
                Empsubarea: oRequestDetails.PersonnelSubArea,
                Empsubareatext: oRequestDetails.PersonnelSubAreaText,
                Empdept: oRequestDetails.Department,
                Empposition: oRequestDetails.PositionText,
                to_share: oViewModel.getProperty("/selectedType") === "S" ? oSharesData : [],
                to_dividend: oViewModel.getProperty("/selectedType") === "D" ? oDividendData : []
            };
            // Start of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
            let isDividendType = oViewModel.getProperty("/selectedType") === "D";
            let isSharesType = oViewModel.getProperty("/selectedType") === "S";
            if (isDividendType) {
                oPayload.Finyr = oViewModel.getProperty("/finYear");
            }
            if (isSharesType) {
                oPayload.Finyr = oViewModel.getProperty("/finYear");
                // var sMonthYear = oViewModel.getProperty("/monthYear");
                // oPayload.Formonyear = sMonthYear;
            }
            // End of Change: 08.10.2026 : Balamurugan : Financial Year and Month-Year Fields Added
            if (oViewModel.getProperty("/TransactionId")) {
                oPayload.TransId = oViewModel.getProperty("/TransactionId");
            } else {
                oPayload.TransId = "";
            }
            return oPayload;
        },

        handleSubmitBtnPress: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_FINAL_REQUEST"),
                bProceed = this.validateSubmitRequestDetails();
            var oModel = this.getView().getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    this.sActionFlag = "Submitted";
                    let oPayload = this.createRequestPayload();
                    oModel.create("/ZHCM_CDS_IEPF_HEADER", oPayload, {
                        success: function (oResp) {
                            if (oResp.TransId) {
                                this.TRANS_ID = oResp.TransId;
                                BusyIndicator.hide();
                                messenger.success(oResourceBundle.getText("iepfRequestFinalSuccessMsg", oResp.TransId), () => {
                                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, {}, true);
                                });
                            }
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },

        validateSubmitRequestDetails: function () {
            var oViewModel = this.getView().getModel("viewModel"),
                oResourceBundle = this.getResourceBundle(),
                oRequestDetails = oViewModel.getProperty("/requestDetails"),
                sSelectedType = oViewModel.getProperty("/selectedType"),
                bProceed = true,
                sMessage = "";
            if (!sSelectedType) {
                bProceed = false;
                sMessage = oResourceBundle.getText("selectTypeErrorMsg");
            } else if (sSelectedType === "S" && this.getView().getModel("sharesModel").getProperty("/data").length === 0) {
                bProceed = false;
                sMessage = oResourceBundle.getText("pleaseUploadSharesDataMsg");
            } else if (sSelectedType === "D" && this.getView().getModel("dividendModel").getProperty("/data").length === 0) {
                bProceed = false;
                sMessage = oResourceBundle.getText("pleaseUploadDividendDataMsg");
            }
            if (!bProceed) {
                messenger.error(sMessage);
            }
            return bProceed;
        },

        setTransactionData: function (oRespData) {
            var oViewModel = this.getView().getModel("viewModel");
            let selectedType = oViewModel.getProperty("/selectedType");
            if (selectedType === "S") {
                this.getView().getModel("sharesModel").setProperty("/data", oRespData.to_share.results);
                const oTable = this.byId("idSharesTable");
                const oRowMode = oTable.getRowMode();
                const iCount = this.getView().getModel("sharesModel").getProperty("/data").length;
                if (iCount > 0) {
                    oRowMode.setRowCount(Math.min(iCount, 5));
                }
            } else if (selectedType === "D") {
                this.getView().getModel("dividendModel").setProperty("/data", oRespData.to_dividend.results);
                const oTable = this.byId("idDividendTable");
                const oRowMode = oTable.getRowMode();
                const iCount = this.getView().getModel("dividendModel").getProperty("/data").length;
                if (iCount > 0) {
                    oRowMode.setRowCount(Math.min(iCount, 5));
                }
            }
        },

        onDownloadTemplate: function () {
            const sType = this.getView().getModel("viewModel").getProperty("/selectedType");
            var oResourceBundle = this.getResourceBundle();
            if (sType === "S") {
                const sUrl = sap.ui.require.toUrl(
                    "com/nhpc/zhriepfs1/templates/IEPF-SHARES-UploadTemplateExcel.xlsx"
                );
                const oLink = document.createElement("a");
                oLink.href = sUrl;
                oLink.download = oResourceBundle.getText("sharesTemplateFileName");
                document.body.appendChild(oLink);
                oLink.click();
                document.body.removeChild(oLink);
            } else if (sType === "D") {
                const sUrl = sap.ui.require.toUrl(
                    "com/nhpc/zhriepfs1/templates/IEPF-Dividend-UploadTemplateExcel.xlsm"
                );
                const oLink = document.createElement("a");
                oLink.href = sUrl;
                oLink.download = oResourceBundle.getText("dividendTemplateFileName");
                document.body.appendChild(oLink);
                oLink.click();
                document.body.removeChild(oLink);
            } else {
                messenger.error(oResourceBundle.getText("pleaseSelectTypeErrorMsg"));
            }
        },

        onFileTypeMissmatch: function (oEvent) {
            messenger.error(oResourceBundle.getText("invalidFileTypeMsg"));
            oEvent.getSource().setValue("");
        },

        onFileChange: function (oEvent) {
            var sID = oEvent.getParameter("id");
            this.sFileUploaderID = sID;
            var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            this.checkMalwareValidationUploadExcel(oFile);
        },

        checkMalwareValidationUploadExcel: function (oFileObject) {
            var oResourceBundle = this.getResourceBundle();
            if (oFileObject) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    BusyIndicator.show(0);
                    var aArrayBuffer = event.currentTarget.result;
                    var sBinaryString = this.convertArratBufferToBinary(aArrayBuffer);
                    var sUrl = this.getBaseURL() + "/malware_api/scan";
                    this.aArrayBuffer = aArrayBuffer;
                    BusyIndicator.show(0);
                    jQuery.ajax({
                        url: sUrl,
                        type: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        data: sBinaryString,
                        success: function (oResp) {
                            if (oResp.malwareDetected) {
                                this.byId(this.sFileUploaderID).clear();
                                BusyIndicator.hide();
                                messenger.error(oResourceBundle.getText("malwareFileDetectedErrorMsg"));
                            } else {
                                BusyIndicator.hide();
                                this.extractExcelData(this.aArrayBuffer);
                            }
                        }.bind(this),
                        error: function (error) {
                            BusyIndicator.hide();
                            this.byId(this.sFileUploaderID).clear();
                            messenger.error(oResourceBundle.getText("malwareScanFailedErrorMsg"));
                        }.bind(this)
                    });
                }.bind(this);
                reader.readAsArrayBuffer(oFileObject);
            }
        },

        getBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id"),
                appPath = appId.replaceAll(".", "/"),
                appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },

        convertArratBufferToBinary: function (aArrayBufferObject) {
            var binary = '';
            const bytes = new Uint8Array(aArrayBufferObject);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return binary;
        },

        extractExcelData: function (oData) {
            BusyIndicator.show(0);
            var workbook = XLSX.read(oData, {
                type: "binary",
            });
            workbook.SheetNames.forEach(
                function (sheetName) {
                    if (sheetName === "IEPFDividendList" || sheetName === "IEPFSharesList") {
                        var aExcelData = XLSX.utils.sheet_to_row_object_array(
                            workbook.Sheets[sheetName]
                        );
                        BusyIndicator.hide();
                        this.processUploadedData(aExcelData, sheetName);
                    }
                    BusyIndicator.hide();
                }.bind(this)
            );
        },

        onDelete: function(){
            let oViewModel = this.getView().getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            //OData call need to be added
        }

    });
});