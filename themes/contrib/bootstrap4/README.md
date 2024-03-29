# Bootstrap 4 theme

## Features:

* Includes Bootstrap 4 library (JS and CSS)
* Includes Bootstrap 4 breakpoints
* Bootstrap controls within user interface
* Comes with `no subtheme mode` (unless template override required)

## SASS compilation:

* SASS compilation is no longer in the theme.
* Use [Bootstrap4 Tools](https://www.drupal.org/project/bootstrap4_tools) module

## Installation

### Using composer

`composer require drupal/bootstrap4`

## Subtheme

* If you require subtheme (usually if you want to override templates), 
    see [subtheme docs](_SUBTHEME/README.md).

* You can create subtheme by running `bash bin/subtheme.sh [name] [path]`,
    e.g. `bash bin/subtheme.sh b4subtheme ..`

* Interface subtheme creation is coming to [Bootstrap4 Tools](https://www.drupal.org/project/bootstrap4_tools) module
