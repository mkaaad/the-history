import liBaiData from '../data/li_bai.json';
import liQingzhaoData from '../data/li_qingzhao.json';
import suShiData from '../data/su_shi.json';

export const CHARACTERS = [
	{id: 1, name: '李白', era: '唐朝', status: '日常状态', color: 'blue', events: liBaiData, image: 'images/libai.png', markerIcon: 'images/markers/libai/point.png', markerIconSelected: 'images/markers/libai/point_selected.png'},
	{id: 2, name: '李清照', era: '宋朝', status: '日常状态', color: 'blue', events: liQingzhaoData, image: 'images/liqinghzhao.png', markerIcon: 'images/markers/liqingzhao/point.png', markerIconSelected: 'images/markers/liqingzhao/point_selected.png'},
	{id: 3, name: '苏轼', era: '宋朝', status: '日常状态', color: 'blue', events: suShiData, image: 'images/sushi.png', markerIcon: 'images/markers/sushi/point.png', markerIconSelected: 'images/markers/sushi/point_selected.png'},
];