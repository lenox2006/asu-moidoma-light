import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import React from 'react';
import CircularProgressCustom from './CircularProgressCustom';

/**
 * Таблица списка (перенос ui/Table/Table.js основной системы на MUI v5, без сортировки/чекбоксов).
 *
 * columns: [{ headerName, field, align, width, renderCell(params: {row}) }]
 * rows, summaryRow (итоговая строка, прилипает к низу), loading, emptyListText,
 * tableMaxHeight, handleRowClick(event, row),
 * paginationCurrentPage (с 1), paginationRowsPerPage, paginationRowsCount,
 * rowsPerPageOptions, onPageChange(page), onRowsPerPageChange(value), showTableFooter
 */

const HeadCell = styled(TableCell)(({ theme }) => ({
    position: 'sticky',
    top: 0,
    lineHeight: '1.1rem',
    background: theme.components.MuiTableHead.styleOverrides.root.background,
    borderBottom: theme.components.MuiTableCell.styleOverrides.head.borderBottom,
    zIndex: 7,
}));

const Footer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    background: theme.components.MuiTableFooter.styleOverrides.root.background,
    border: '1px solid #61bbff',
    borderTop: 0,
    borderRadius: '0 0 4px 4px',
}));

const EmptyContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 0',
    color: '#939393',
    '& span': { marginTop: 10 },
});

function setCellWidth(width) {
    if (width === 'auto') return { width: '100%' };
    if (width !== undefined && !Number.isNaN(width)) return { width: `${width}px` };
    return undefined;
}

function EmptyListIcon() {
    return (
        <svg width="105" height="94" viewBox="0 0 184 152" aria-hidden="true" focusable="false">
            <g fill="none" fillRule="evenodd">
                <g transform="translate(24 31.67)">
                    <ellipse className="ant-empty-img-5" cx="67.797" cy="106.89" rx="67.797" ry="12.668" />
                    <path className="ant-empty-img-1" d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z" />
                    <path className="ant-empty-img-2" d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" />
                    <path className="ant-empty-img-3" d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z" />
                </g>
                <path className="ant-empty-img-3" d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z" />
                <g className="ant-empty-img-4" transform="translate(149.65 15.383)">
                    <ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
                    <path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
                </g>
            </g>
        </svg>
    );
}

const Table = ({
    columns = [],
    rows = [],
    summaryRow = null,
    loading = false,
    loadingText = 'Загрузка данных',
    emptyListText = 'Нет записей',
    tableMaxHeight = null,
    tableMinHeight = 254,
    handleRowClick,
    hover = true,
    showTableFooter = true,
    paginationCurrentPage = 1,
    paginationRowsPerPage = 25,
    paginationRowsCount = 0,
    rowsPerPageOptions = [25, 50, { value: -1, label: 'Все' }],
    onPageChange = () => {},
    onRowsPerPageChange = () => {},
    footerLeft = null,
}) => {
    const minHeight = tableMinHeight;
    const clickable = typeof handleRowClick === 'function';

    const renderCells = (row, isSummary = false) => columns.map((column, i) => (
        <TableCell
            align={column.align || 'left'}
            key={`tr-cell-${i}`}
            sx={isSummary ? { fontWeight: 600 } : undefined}
        >
            {column.renderCell ? column.renderCell({ row }) : (row[column.field] ?? '')}
        </TableCell>
    ));

    return (
        <>
            <TableContainer
                style={{
                    maxHeight: tableMaxHeight,
                    minHeight,
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: tableMaxHeight ? 'auto' : 'visible', // без maxHeight — без внутренней прокрутки
                }}
            >
                <MuiTable stickyHeader aria-label="Таблица с данными" style={{ height: loading ? '100%' : 'auto' }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((column, i) => (
                                <HeadCell
                                    variant="head"
                                    align={column.alignHeader || column.align || 'left'}
                                    key={`th-cell-${i}`}
                                    style={setCellWidth(column.width)}
                                >
                                    {column.headerName}
                                </HeadCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <tr>
                                <td colSpan={1000} align="center">
                                    <EmptyContainer>
                                        <CircularProgressCustom />
                                        <span>{loadingText}</span>
                                    </EmptyContainer>
                                </td>
                            </tr>
                        ) : rows.length > 0 ? (
                            <>
                                {rows.map((row, idx) => (
                                    <TableRow
                                        hover={hover}
                                        key={`row-${row.mark ?? row.id ?? idx}`}
                                        style={clickable ? { cursor: 'pointer' } : undefined}
                                        onClick={(event) => clickable && handleRowClick(event, row)}
                                    >
                                        {renderCells(row)}
                                    </TableRow>
                                ))}
                                {summaryRow ? (
                                    <TableRow
                                        style={{
                                            position: 'sticky',
                                            bottom: 0,
                                            background: '#f6fbff',
                                            border: 0,
                                            outline: '2px solid rgba(32, 160, 255, 0.5)',
                                        }}
                                    >
                                        {renderCells(summaryRow, true)}
                                    </TableRow>
                                ) : null}
                            </>
                        ) : (
                            <tr>
                                <td colSpan={1000} align="center">
                                    <EmptyContainer>
                                        <EmptyListIcon />
                                        {emptyListText ? <span>{emptyListText}</span> : null}
                                    </EmptyContainer>
                                </td>
                            </tr>
                        )}
                    </TableBody>
                </MuiTable>
            </TableContainer>

            {showTableFooter ? (
                <Footer>
                    {footerLeft ? <div style={{ flexGrow: 1, marginLeft: 25 }}>{footerLeft}</div> : null}
                    <TablePagination
                        component="div"
                        rowsPerPageOptions={rowsPerPageOptions}
                        page={Math.max(0, paginationCurrentPage - 1)}
                        rowsPerPage={paginationRowsPerPage}
                        count={paginationRowsCount}
                        SelectProps={{ native: true }}
                        labelRowsPerPage="Строк на странице:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to !== -1 ? to : rows.length} из ${count !== -1 ? count : rows.length}`}
                        onPageChange={(e, page) => onPageChange(page + 1)}
                        onRowsPerPageChange={(e) => onRowsPerPageChange(e.target.value)}
                        sx={{ borderBottom: 0 }}
                    />
                </Footer>
            ) : null}
        </>
    );
};

export default Table;
