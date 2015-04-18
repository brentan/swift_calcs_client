#
# -*- Configuration -*-
#

# inputs
SRC_DIR = ./src
INTRO = $(SRC_DIR)/wrapper/intro.js
OUTRO = $(SRC_DIR)/wrapper/outro.js

PJS_SRC = ./node_modules/pjs/src/p.js

SOURCES = \
  $(PJS_SRC) \
  $(SRC_DIR)/*.js \
  $(SRC_DIR)/workspace/workspace.js \
  $(SRC_DIR)/workspace/*.js \
  $(SRC_DIR)/elements/*.js 

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(shell find $(CSS_DIR) -name '*.less')

BUILD_DIR = ./build
APP_DIR = ../swift_calcs
BUILD_JS = $(BUILD_DIR)/swift_calcs.js
BUILD_CSS = $(BUILD_DIR)/swift_calcs.css
UGLY_JS = $(BUILD_DIR)/swift_calcs.min.js

# programs and flags
UGLIFY ?= ./node_modules/.bin/uglifyjs
UGLIFY_OPTS ?= --mangle --compress hoist_vars=true

LESSC ?= ./node_modules/.bin/lessc
LESS_OPTS ?=

# Empty target files whose Last Modified timestamps are used to record when
# something like `npm install` last happened (which, for example, would then be
# compared with its dependency, package.json, so if package.json has been
# modified since the last `npm install`, Make will `npm install` again).
# http://www.gnu.org/software/make/manual/html_node/Empty-Targets.html#Empty-Targets
NODE_MODULES_INSTALLED = ./node_modules/.installed--used_by_Makefile
BUILD_DIR_EXISTS = $(BUILD_DIR)/.exists--used_by_Makefile

# environment constants

#
# -*- Build tasks -*-
#

all: css uglify

app: css js
	# BE SURE TO REMOVE include swift_calcs AND ADD include swift_calcs-dev TO APPLICATION.JS, and similar for APPLICATION.css
	cp -f $(BUILD_DIR)/swift_calcs.js ./$(APP_DIR)/app/assets/javascripts/swift_calcs-dev.js
	cp -f $(BUILD_DIR)/swift_calcs.css ./$(APP_DIR)/app/assets/stylesheets/swift_calcs-dev.css
# dev is like all, but without minification
js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)

$(PJS_SRC): $(NODE_MODULES_INSTALLED)

$(BUILD_JS): $(INTRO) $(SOURCES) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_JS): $(BUILD_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BUILD_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@

$(NODE_MODULES_INSTALLED): package.json
	npm install
	touch $(NODE_MODULES_INSTALLED)

$(BUILD_DIR_EXISTS):
	mkdir -p $(BUILD_DIR)
	touch $(BUILD_DIR_EXISTS)
