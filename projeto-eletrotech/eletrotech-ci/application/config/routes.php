<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	https://codeigniter.com/userguide3/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There are three reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router which controller/method to use if those
| provided in the URL cannot be matched to a valid route.
|
|	$route['translate_uri_dashes'] = FALSE;
|
| This is not exactly a route, but allows you to automatically route
| controller and method names that contain dashes. '-' isn't a valid
| class or method name character, so it requires translation.
| When you set this option to TRUE, it will replace ALL dashes in the
| controller and method URI segments.
|
| Examples:	my-controller/index	-> my_controller/index
|		my-controller/my-method	-> my_controller/my_method
*/
$route['default_controller'] = 'AuthController';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// Mapeia as URLs curtas para os controllers
$route['auth'] = 'AuthController';
$route['auth/(.+)'] = 'AuthController/$1';
$route['home'] = 'HomeController';
$route['menu'] = 'MenuController';
$route['usuarios'] = 'UsuariosController';
$route['usuarios/(.+)'] = 'UsuariosController/$1';
$route['eletricistas'] = 'EletricistasController';
$route['eletricistas/(.+)'] = 'EletricistasController/$1';
$route['produtos'] = 'ProdutosController';
$route['produtos/(.+)'] = 'ProdutosController/$1';
$route['metas'] = 'MetasController';
$route['metas/(.+)'] = 'MetasController/$1';
$route['checklist'] = 'ChecklistController';
$route['checklist/(.+)'] = 'ChecklistController/$1';
$route['ordemServico'] = 'OrdensServicoController';
$route['ordemServico/(.+)'] = 'OrdensServicoController/$1';
$route['consultachecklist/(.+)'] = 'ConsultaChecklistController/$1';
$route['consultachecklist'] = 'ConsultaChecklistController';
$route['baixas'] = 'BaixasController';
$route['baixas/(.+)'] = 'BaixasController/$1';
$route['lancamentos'] = 'LancamentosController';
$route['lancamentos/(.+)'] = 'LancamentosController/$1';
$route['chat/(.+)'] = 'ChatController/$1';
