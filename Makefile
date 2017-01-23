#
# -*- Configuration -*-
#

# inputs
VERSION = 4_15
EMBED_VER = 1_00
SRC_DIR = ./src
INTRO = $(SRC_DIR)/wrapper/intro.js
OUTRO = $(SRC_DIR)/wrapper/outro.js
SRC_DIR_WORKER = ./src_worker
INTRO_WORKER = $(SRC_DIR_WORKER)/wrapper/intro.js
OUTRO_WORKER = $(SRC_DIR_WORKER)/wrapper/outro.js
SRC_DIR_CLIENT_EMBED = ./src_embed/client
INTRO_CLIENT_EMBED = $(SRC_DIR_CLIENT_EMBED)/wrapper/intro.js
OUTRO_CLIENT_EMBED = $(SRC_DIR_CLIENT_EMBED)/wrapper/outro.js
SRC_DIR_SERVER_EMBED = ./src_embed/server
INTRO_SERVER_EMBED = $(SRC_DIR_SERVER_EMBED)/wrapper/intro.js
OUTRO_SERVER_EMBED = $(SRC_DIR_SERVER_EMBED)/wrapper/outro.js

PJS_SRC = ./node_modules/pjs/src/p.js

SOURCES = \
  $(PJS_SRC) \
  $(SRC_DIR)/*.js \
  $(SRC_DIR)/worksheet/worksheet.js \
  $(SRC_DIR)/worksheet/*.js \
  $(SRC_DIR)/utilities/*.js \
  $(SRC_DIR)/elements/*.js \
  $(SRC_DIR)/elements/*/*.js 
PRE_SOURCES = \
  $(SRC_DIR)/ui_support/*.js \

SOURCES_WORKER = $(SRC_DIR_WORKER)/*.js
SOURCES_CLIENT_EMBED = $(SRC_DIR_CLIENT_EMBED)/*.js
SOURCES_SERVER_EMBED = $(SRC_DIR_SERVER_EMBED)/*.js

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(shell find $(CSS_DIR) -name '*.less')

BUILD_DIR = ./build
APP_DIR = ../swift_calcs
BUILD_JS = $(BUILD_DIR)/swift_calcs$(VERSION).js
BUILD_JS_WORKER = $(BUILD_DIR)/giac_worker$(VERSION).js
BUILD_JS_CLIENT_EMBED  = $(BUILD_DIR)/sc_client_embed$(EMBED_VER).js
BUILD_JS_SERVER_EMBED  = $(BUILD_DIR)/sc_server_embed$(EMBED_VER).js
BUILD_CSS = $(BUILD_DIR)/swift_calcs$(VERSION).css
UGLY_JS = $(BUILD_DIR)/swift_calcs$(VERSION).min.js
UGLY_JS_MAP_URL = swift_calcs$(VERSION).js.map
UGLY_JS_MAP = $(BUILD_DIR)/$(UGLY_JS_MAP_URL)
UGLY_JS_WORKER = $(BUILD_DIR)/giac_worker$(VERSION).min.js
UGLY_JS_WORKER_MAP_URL = giac_worker$(VERSION).js.map
UGLY_JS_WORKER_MAP = $(BUILD_DIR)/$(UGLY_JS_WORKER_MAP_URL)
UGLY_JS_CLIENT_EMBED = $(BUILD_DIR)/sc_client_embed$(EMBED_VER).min.js
UGLY_JS_CLIENT_EMBED_MAP_URL = sc_client_embed$(EMBED_VER).js.map
UGLY_JS_CLIENT_EMBED_MAP = $(BUILD_DIR)/$(UGLY_JS_CLIENT_EMBED_MAP_URL)
UGLY_JS_SERVER_EMBED = $(BUILD_DIR)/sc_server_embed$(EMBED_VER).min.js
UGLY_JS_SERVER_EMBED_MAP_URL = sc_server_embed$(EMBED_VER).js.map
UGLY_JS_SERVER_EMBED_MAP = $(BUILD_DIR)/$(UGLY_JS_SERVER_EMBED_MAP_URL)
CLEAN += $(BUILD_DIR)/*$(VERSION).*

# programs and flags
UGLIFY ?= ./node_modules/.bin/uglifyjs
UGLIFY_OPTS ?= --mangle --compress hoist_vars=true --source-map-include-sources

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

app: css js js_worker js_client_embed js_server_embed
	rm -rf ./$(APP_DIR)/public/libraries/swift_calcs*.js
	rm -rf ./$(APP_DIR)/public/libraries/giac_worker*.js
	rm -rf ./$(APP_DIR)/public/libraries/embed/sc_server_embed*.js
	cp -f $(BUILD_DIR)/swift_calcs$(VERSION).js ./$(APP_DIR)/public/libraries/swift_calcs$(VERSION).js
	cp -f $(BUILD_DIR)/giac_worker$(VERSION).js ./$(APP_DIR)/public/libraries/giac_worker$(VERSION).js
	cp -f $(BUILD_DIR)/sc_client_embed$(EMBED_VER).js ./$(APP_DIR)/public/libraries/embed/sc_client_embed$(EMBED_VER).js
	cp -f $(BUILD_DIR)/sc_server_embed$(EMBED_VER).js ./$(APP_DIR)/public/libraries/embed/sc_server_embed$(EMBED_VER).js
	cp -f $(BUILD_DIR)/swift_calcs$(VERSION).css ./$(APP_DIR)/app/assets/stylesheets/swift_calcs.css

app_ugly: css uglify uglify_worker uglify_client_embed uglify_server_embed
	rm -rf ./$(APP_DIR)/public/libraries/swift_calcs*.js
	rm -rf ./$(APP_DIR)/public/libraries/giac_worker*.js
	rm -rf ./$(APP_DIR)/public/libraries/embed/sc_server_embed*.js
	rm -rf ./$(APP_DIR)/public/libraries/swift_calcs*.js.map
	rm -rf ./$(APP_DIR)/public/libraries/giac_worker*.js.map
	rm -rf ./$(APP_DIR)/public/libraries/embed/sc_*.js.map
	cp -f $(BUILD_DIR)/swift_calcs$(VERSION).min.js ./$(APP_DIR)/public/libraries/swift_calcs$(VERSION).js
	cp -f $(BUILD_DIR)/giac_worker$(VERSION).min.js ./$(APP_DIR)/public/libraries/giac_worker$(VERSION).js
	cp -f $(BUILD_DIR)/sc_client_embed$(EMBED_VER).min.js ./$(APP_DIR)/public/libraries/embed/sc_client_embed$(EMBED_VER).js
	cp -f $(BUILD_DIR)/sc_server_embed$(EMBED_VER).min.js ./$(APP_DIR)/public/libraries/embed/sc_server_embed$(EMBED_VER).js
	#cp -f $(BUILD_DIR)/swift_calcs$(VERSION).js.map ./$(APP_DIR)/public/libraries/swift_calcs$(VERSION).js.map
	#cp -f $(BUILD_DIR)/giac_worker$(VERSION).js.map ./$(APP_DIR)/public/libraries/giac_worker$(VERSION).js.map
	cp -f $(BUILD_DIR)/swift_calcs$(VERSION).css ./$(APP_DIR)/app/assets/stylesheets/swift_calcs.css

js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)
clean:
	rm -rf $(CLEAN)

$(PJS_SRC): $(NODE_MODULES_INSTALLED)

$(BUILD_JS): $(PRE_SOURCES) $(INTRO) $(SOURCES) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_JS): $(BUILD_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $< $(UGLIFY_OPTS) --source-map $(UGLY_JS_MAP) --source-map-url $(UGLY_JS_MAP_URL) -o $@

$(BUILD_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@

$(NODE_MODULES_INSTALLED): package.json
	npm install
	touch $(NODE_MODULES_INSTALLED)

$(BUILD_DIR_EXISTS):
	mkdir -p $(BUILD_DIR)
	touch $(BUILD_DIR_EXISTS)

js_worker: $(BUILD_JS_WORKER)
uglify_worker: $(UGLY_JS_WORKER)
js_client_embed: $(BUILD_JS_CLIENT_EMBED)
uglify_client_embed: $(UGLY_JS_CLIENT_EMBED)
js_server_embed: $(BUILD_JS_SERVER_EMBED)
uglify_server_embed: $(UGLY_JS_SERVER_EMBED)

$(BUILD_JS_WORKER): $(INTRO_WORKER) $(SOURCES_WORKER) $(OUTRO_WORKER) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_JS_WORKER): $(BUILD_JS_WORKER) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $< $(UGLIFY_OPTS) --source-map $(UGLY_JS_WORKER_MAP) --source-map-url $(UGLY_JS_WORKER_MAP_URL) -o $@

$(BUILD_JS_CLIENT_EMBED): $(INTRO_CLIENT_EMBED) $(SOURCES_CLIENT_EMBED) $(OUTRO_CLIENT_EMBED) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_JS_CLIENT_EMBED): $(BUILD_JS_CLIENT_EMBED) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $< $(UGLIFY_OPTS) --source-map $(UGLY_JS_CLIENT_EMBED_MAP) --source-map-url $(UGLY_JS_CLIENT_EMBED_MAP_URL) -o $@

$(BUILD_JS_SERVER_EMBED): $(INTRO_SERVER_EMBED) $(SOURCES_SERVER_EMBED) $(OUTRO_SERVER_EMBED) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_JS_SERVER_EMBED): $(BUILD_JS_SERVER_EMBED) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $< $(UGLIFY_OPTS) --source-map $(UGLY_JS_SERVER_EMBED_MAP) --source-map-url $(UGLY_JS_SERVER_EMBED_MAP_URL) -o $@
