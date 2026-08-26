## [2.20.1](https://github.com/uplbtools/room-tba/compare/v2.20.0...v2.20.1) (2026-08-15)


### Bug Fixes

* **map:** import map view store ([973fc24](https://github.com/uplbtools/room-tba/commit/973fc24b84e66a0644c582f5424cbbd973ac8a34))

# [2.20.0](https://github.com/uplbtools/room-tba/compare/v2.19.3...v2.20.0) (2026-08-13)


### Bug Fixes

* **planner:** auto-load more sections on scroll; count courses in the note ([71bb91a](https://github.com/uplbtools/room-tba/commit/71bb91a6ce0b60d2af225e13745164dcf463a721))


### Features

* **map:** camera debug mode via right-click menu ([#964](https://github.com/uplbtools/room-tba/issues/964)) ([405afa9](https://github.com/uplbtools/room-tba/commit/405afa9c136557f8ac9a2181507617d61db8a44c))

## [2.19.3](https://github.com/uplbtools/room-tba/compare/v2.19.2...v2.19.3) (2026-08-13)


### Bug Fixes

* **map:** measure-route legibility, mode-aware snapping, visible route line ([a7893ad](https://github.com/uplbtools/room-tba/commit/a7893aded2dc8f371e613d62557f3b051d8ea6ec))

## [2.19.2](https://github.com/uplbtools/room-tba/compare/v2.19.1...v2.19.2) (2026-08-13)


### Bug Fixes

* **map-chrome:** keep the map tools panel within the viewport ([37f2579](https://github.com/uplbtools/room-tba/commit/37f2579ef7cac64d54021a5d39c9ca7cd846937c))
* **map:** restore vector basemap on MapLibre 6 (?worker&url) ([13e7cbc](https://github.com/uplbtools/room-tba/commit/13e7cbc8c5bd88e8793146fac6c8c97e72063555)), closes [#1003](https://github.com/uplbtools/room-tba/issues/1003)

## [2.19.1](https://github.com/uplbtools/room-tba/compare/v2.19.0...v2.19.1) (2026-08-12)


### Bug Fixes

* **chrome:** size app menu rows with border-box ([d9903b9](https://github.com/uplbtools/room-tba/commit/d9903b951131a09514c28fba3ac0e7645ada40f0))
* **finals:** repair empty-state copy ([021469b](https://github.com/uplbtools/room-tba/commit/021469b9928479b89608baf6e89bdd1134e4804d))
* **modal:** paint dialogs immediately and let Escape close them ([1dc638c](https://github.com/uplbtools/room-tba/commit/1dc638cb3d19d03273fa1173d79c905129def1be))
* **onboarding:** show the welcome modal once, and while data loads ([e54101a](https://github.com/uplbtools/room-tba/commit/e54101a2c861a651ed99cab9cf162bb482223a51))
* **planner:** make the course and section list scrollable ([33e7e25](https://github.com/uplbtools/room-tba/commit/33e7e25915da03bb84b70fc4c3022500aff12874))
* **search:** rank exact and word-start matches above substrings ([11264ea](https://github.com/uplbtools/room-tba/commit/11264ea86d6d3ef615f13eb665fcd099098e4397))


### Performance Improvements

* **bootstrap:** paint returning visits from a JSON snapshot ([4c38c13](https://github.com/uplbtools/room-tba/commit/4c38c13953d1f7e046df8ebee399a420421a9395))

# [2.19.0](https://github.com/uplbtools/room-tba/compare/v2.18.2...v2.19.0) (2026-08-11)


### Features

* **map:** add Wayback imagery ([#967](https://github.com/uplbtools/room-tba/issues/967)) ([#1012](https://github.com/uplbtools/room-tba/issues/1012)) ([d25a32b](https://github.com/uplbtools/room-tba/commit/d25a32b18fcb5351ab4642b2e5bd5eee94fdf930))

## [2.18.2](https://github.com/uplbtools/room-tba/compare/v2.18.1...v2.18.2) (2026-08-11)


### Bug Fixes

* **map:** add external campus markers ([#1008](https://github.com/uplbtools/room-tba/issues/1008)) ([d22c6b9](https://github.com/uplbtools/room-tba/commit/d22c6b99dcffd7594d4158fcb33b4530bea385ef))

## [2.18.1](https://github.com/uplbtools/room-tba/compare/v2.18.0...v2.18.1) (2026-08-11)


### Bug Fixes

* **dorms:** show full photos ([#988](https://github.com/uplbtools/room-tba/issues/988)) ([0cdb251](https://github.com/uplbtools/room-tba/commit/0cdb251f7a1c3736438d22fd9f39f495ce3077c8))
* **map:** rebase satellite controls ([#1000](https://github.com/uplbtools/room-tba/issues/1000)) ([34d5d9a](https://github.com/uplbtools/room-tba/commit/34d5d9a17ac1cdba19ccaf8e92b94c33709e96ce))
* **maps:** prefer named place links ([#990](https://github.com/uplbtools/room-tba/issues/990)) ([11afc49](https://github.com/uplbtools/room-tba/commit/11afc498dcd78dadc5f5c7cb2b9627a5189ec81b))
* **rooms:** consolidate approved room aliases ([#986](https://github.com/uplbtools/room-tba/issues/986)) ([fe14c1a](https://github.com/uplbtools/room-tba/commit/fe14c1a0e559f61ba58595a7637affa2712e543b))

# [2.18.0](https://github.com/uplbtools/room-tba/compare/v2.17.0...v2.18.0) (2026-08-11)


### Bug Fixes

* **campus:** restore live browse coverage and audited links ([#998](https://github.com/uplbtools/room-tba/issues/998)) ([a02685e](https://github.com/uplbtools/room-tba/commit/a02685ecf44a5e90c6a595fa2a8e2af312bcbc29))
* **map:** commit external campus footprints GeoJSON ([006d5ee](https://github.com/uplbtools/room-tba/commit/006d5ee100d215df75cac2537f2129df5e770cd1)), closes [#991](https://github.com/uplbtools/room-tba/issues/991)
* **map:** define missing external campuses layer helper ([386b827](https://github.com/uplbtools/room-tba/commit/386b8278e75f1751b79e60d3fd39fb974bb32db2)), closes [#991](https://github.com/uplbtools/room-tba/issues/991)


### Features

* **safety:** add offline hotlines and curfew guide (refs [#995](https://github.com/uplbtools/room-tba/issues/995), [#996](https://github.com/uplbtools/room-tba/issues/996)) ([#997](https://github.com/uplbtools/room-tba/issues/997)) ([ec36b34](https://github.com/uplbtools/room-tba/commit/ec36b341c7c0123c5aad886bd34da58f4c6709b2))


### Performance Improvements

* **api:** edge-cache public campus read routes ([#994](https://github.com/uplbtools/room-tba/issues/994)) ([3eb4071](https://github.com/uplbtools/room-tba/commit/3eb407194bbe3bfa09830611b1771c20a947f531))

# [2.14.0](https://github.com/uplbtools/room-tba/compare/v2.13.4...v2.14.0) (2026-08-06)


### Features

* **street-view:** scaffold Street View lookup and a coverage audit ([#961](https://github.com/uplbtools/room-tba/issues/961)) ([2efb490](https://github.com/uplbtools/room-tba/commit/2efb490053eadb0d62a0e4d53fa75f488f275ab0))

## [2.13.4](https://github.com/uplbtools/room-tba/compare/v2.13.3...v2.13.4) (2026-08-05)


### Bug Fixes

* **chrome:** restore the App menu and pin the desktop top bar flush ([#952](https://github.com/uplbtools/room-tba/issues/952)) ([df4e2af](https://github.com/uplbtools/room-tba/commit/df4e2affc11a7062652a5f8e6652b2857e1a6670)), closes [#931](https://github.com/uplbtools/room-tba/issues/931) [#910](https://github.com/uplbtools/room-tba/issues/910) [#911](https://github.com/uplbtools/room-tba/issues/911) [#916](https://github.com/uplbtools/room-tba/issues/916) [#918](https://github.com/uplbtools/room-tba/issues/918) [#920](https://github.com/uplbtools/room-tba/issues/920) [#921](https://github.com/uplbtools/room-tba/issues/921) [#923](https://github.com/uplbtools/room-tba/issues/923) [#927](https://github.com/uplbtools/room-tba/issues/927) [#927](https://github.com/uplbtools/room-tba/issues/927) [#890](https://github.com/uplbtools/room-tba/issues/890) [#944](https://github.com/uplbtools/room-tba/issues/944) [#905](https://github.com/uplbtools/room-tba/issues/905) [#935](https://github.com/uplbtools/room-tba/issues/935) [#937](https://github.com/uplbtools/room-tba/issues/937) [#942](https://github.com/uplbtools/room-tba/issues/942) [#940](https://github.com/uplbtools/room-tba/issues/940) [#943](https://github.com/uplbtools/room-tba/issues/943) [#931](https://github.com/uplbtools/room-tba/issues/931) [#936](https://github.com/uplbtools/room-tba/issues/936) [#938](https://github.com/uplbtools/room-tba/issues/938) [#939](https://github.com/uplbtools/room-tba/issues/939) [#941](https://github.com/uplbtools/room-tba/issues/941) [#933](https://github.com/uplbtools/room-tba/issues/933) [#934](https://github.com/uplbtools/room-tba/issues/934) [#934](https://github.com/uplbtools/room-tba/issues/934) [#931](https://github.com/uplbtools/room-tba/issues/931) [#931](https://github.com/uplbtools/room-tba/issues/931) [#946](https://github.com/uplbtools/room-tba/issues/946) [#948](https://github.com/uplbtools/room-tba/issues/948) [#942](https://github.com/uplbtools/room-tba/issues/942) [#942](https://github.com/uplbtools/room-tba/issues/942) [#942](https://github.com/uplbtools/room-tba/issues/942) [#951](https://github.com/uplbtools/room-tba/issues/951) [#893](https://github.com/uplbtools/room-tba/issues/893)
* **map:** surface poor GPS accuracy for locate-me ([48e3c1e](https://github.com/uplbtools/room-tba/commit/48e3c1e154704904be885c5c82a4682f0342670f))

## [2.13.3](https://github.com/uplbtools/room-tba/compare/v2.13.2...v2.13.3) (2026-08-05)


### Bug Fixes

* **nav:** actually give the browse chips a 44px target on mobile ([#948](https://github.com/uplbtools/room-tba/issues/948)) ([9e85d42](https://github.com/uplbtools/room-tba/commit/9e85d42b169526475303a5f9ecd65b40b0cd5ffd)), closes [#942](https://github.com/uplbtools/room-tba/issues/942) [#942](https://github.com/uplbtools/room-tba/issues/942) [#942](https://github.com/uplbtools/room-tba/issues/942)

## [2.13.2](https://github.com/uplbtools/room-tba/compare/v2.13.1...v2.13.2) (2026-08-05)


### Bug Fixes

* **nav:** give browse chips a 44px touch target on mobile ([#942](https://github.com/uplbtools/room-tba/issues/942)) ([f743602](https://github.com/uplbtools/room-tba/commit/f743602575d8fab67e1e7a3b4a72e3fae0b5dfde)), closes [#940](https://github.com/uplbtools/room-tba/issues/940)

## [2.13.1](https://github.com/uplbtools/room-tba/compare/v2.13.0...v2.13.1) (2026-08-05)


### Bug Fixes

* **e2e:** unbreak main after the redesign removed the bottom chrome ([#944](https://github.com/uplbtools/room-tba/issues/944)) ([6adc606](https://github.com/uplbtools/room-tba/commit/6adc606e3e4b1c8a09427d3b25c3c22a6fff09fa)), closes [#905](https://github.com/uplbtools/room-tba/issues/905) [#935](https://github.com/uplbtools/room-tba/issues/935) [#937](https://github.com/uplbtools/room-tba/issues/937)
# [2.13.0](https://github.com/uplbtools/room-tba/compare/v2.12.3...v2.13.0) (2026-08-04)


### Bug Fixes

* **3d:** declutter room labels and make the 3D viewer usable on phones ([#801](https://github.com/uplbtools/room-tba/issues/801)) ([38de07c](https://github.com/uplbtools/room-tba/commit/38de07c1c6658f174231d54c9d78e7b7c15ac652)), closes [#879](https://github.com/uplbtools/room-tba/issues/879) [#887](https://github.com/uplbtools/room-tba/issues/887) [#888](https://github.com/uplbtools/room-tba/issues/888)
* **landing:** rebalance the welcome modal on mobile ([#894](https://github.com/uplbtools/room-tba/issues/894)) ([87c9aab](https://github.com/uplbtools/room-tba/commit/87c9aab6661faa33845650e4c72a86d00bb4e35b))
* **map:** draw transit routes along real roads, not straight lines ([#802](https://github.com/uplbtools/room-tba/issues/802)) ([8b7bedd](https://github.com/uplbtools/room-tba/commit/8b7bedd0fe37b93736203803d3ad9c09e1a3dbb6))
* **nav:** give Colleges, Orgs and Classes a mobile home, drop the dead rail ([63ba9f4](https://github.com/uplbtools/room-tba/commit/63ba9f42e4fcb6483f5036678423152c9a6d7d6f))
* **og:** give the share card's text its own surface ([#810](https://github.com/uplbtools/room-tba/issues/810)) ([73c0832](https://github.com/uplbtools/room-tba/commit/73c0832d465d46929ca66e19b6dbc04b525488b9)), closes [#890](https://github.com/uplbtools/room-tba/issues/890) [#809](https://github.com/uplbtools/room-tba/issues/809) [#822](https://github.com/uplbtools/room-tba/issues/822) [#826](https://github.com/uplbtools/room-tba/issues/826) [#831](https://github.com/uplbtools/room-tba/issues/831) [#834](https://github.com/uplbtools/room-tba/issues/834) [#868](https://github.com/uplbtools/room-tba/issues/868) [#868](https://github.com/uplbtools/room-tba/issues/868) [#908](https://github.com/uplbtools/room-tba/issues/908)


### Features

* **3d:** infer room placements and stop dead-ending on missing footprints ([#795](https://github.com/uplbtools/room-tba/issues/795)) ([15b25c6](https://github.com/uplbtools/room-tba/commit/15b25c63dfda0e70fb8dc3d6ffdde3cd40d73784)), closes [#879](https://github.com/uplbtools/room-tba/issues/879) [#887](https://github.com/uplbtools/room-tba/issues/887) [#888](https://github.com/uplbtools/room-tba/issues/888)
* **calendar:** show the registrar academic calendar milestones ([#805](https://github.com/uplbtools/room-tba/issues/805)) ([634c5ae](https://github.com/uplbtools/room-tba/commit/634c5ae0b24621a26130f9c0577ca2cadc1aa61f))
* **data:** read-only campus data audit for wrong pins and missing links ([#892](https://github.com/uplbtools/room-tba/issues/892)) ([a153008](https://github.com/uplbtools/room-tba/commit/a153008fb3344fa91c11ab7420dafac959c860e2)), closes [#886](https://github.com/uplbtools/room-tba/issues/886) [#890](https://github.com/uplbtools/room-tba/issues/890) [#809](https://github.com/uplbtools/room-tba/issues/809) [#822](https://github.com/uplbtools/room-tba/issues/822) [#826](https://github.com/uplbtools/room-tba/issues/826) [#831](https://github.com/uplbtools/room-tba/issues/831) [#834](https://github.com/uplbtools/room-tba/issues/834) [#868](https://github.com/uplbtools/room-tba/issues/868) [#868](https://github.com/uplbtools/room-tba/issues/868) [#908](https://github.com/uplbtools/room-tba/issues/908)
* **feedback:** in-app feedback box with Discord notification ([#888](https://github.com/uplbtools/room-tba/issues/888)) ([234c49a](https://github.com/uplbtools/room-tba/commit/234c49a6f2559d570e1975b463794846aee5f4ce)), closes [#881](https://github.com/uplbtools/room-tba/issues/881) [#879](https://github.com/uplbtools/room-tba/issues/879) [#890](https://github.com/uplbtools/room-tba/issues/890) [#809](https://github.com/uplbtools/room-tba/issues/809) [#822](https://github.com/uplbtools/room-tba/issues/822) [#826](https://github.com/uplbtools/room-tba/issues/826) [#831](https://github.com/uplbtools/room-tba/issues/831) [#834](https://github.com/uplbtools/room-tba/issues/834) [#868](https://github.com/uplbtools/room-tba/issues/868) [#868](https://github.com/uplbtools/room-tba/issues/868) [#908](https://github.com/uplbtools/room-tba/issues/908)
* **map-chrome:** desktop + mobile redesign chrome ([1c51738](https://github.com/uplbtools/room-tba/commit/1c51738d7aaee2e0915ab9d6779db016c3f68dc3))
* **map-chrome:** GMaps-style bottom sheet for entity details ([6da3aec](https://github.com/uplbtools/room-tba/commit/6da3aecd1322811822f2eb4bc86fab92422520b8))
* **map-chrome:** mobile search overlay and half-sheet peek ([42b6daa](https://github.com/uplbtools/room-tba/commit/42b6daad4b1e6ea677a36e1e6d13c17cbc449ed3))
* **rooms:** store the unabbreviated room name in full_name ([#879](https://github.com/uplbtools/room-tba/issues/879)) ([bef1185](https://github.com/uplbtools/room-tba/commit/bef1185bbea4be258ca39815011ed93bb628cb58)), closes [#875](https://github.com/uplbtools/room-tba/issues/875)

## [2.12.3](https://github.com/uplbtools/room-tba/compare/v2.12.2...v2.12.3) (2026-08-04)


### Bug Fixes

* **map-chrome:** give the status a zero flex basis so it shrinks, not wraps ([#937](https://github.com/uplbtools/room-tba/issues/937)) ([a23fcc6](https://github.com/uplbtools/room-tba/commit/a23fcc6ba4560f9e67381f8df0abbf4e8447c85d)), closes [#935](https://github.com/uplbtools/room-tba/issues/935) [#935](https://github.com/uplbtools/room-tba/issues/935)

## [2.12.2](https://github.com/uplbtools/room-tba/compare/v2.12.1...v2.12.2) (2026-08-04)


### Bug Fixes

* **ci:** check migrations against a run schema, not E2E public ([#926](https://github.com/uplbtools/room-tba/issues/926)) ([d208c92](https://github.com/uplbtools/room-tba/commit/d208c923850bcea4b1b162f57b730deed51ffaf3)), closes [#773](https://github.com/uplbtools/room-tba/issues/773)
* **search:** escape backslash in LIKE patterns, and share one implementation ([#928](https://github.com/uplbtools/room-tba/issues/928)) ([e2a26e7](https://github.com/uplbtools/room-tba/commit/e2a26e7b929cc8404dc855f89b619d393dc59f45))

## [2.12.1](https://github.com/uplbtools/room-tba/compare/v2.12.0...v2.12.1) (2026-08-04)


### Bug Fixes

* **map-chrome:** let the pill wrap again, the status ellipsises instead ([#935](https://github.com/uplbtools/room-tba/issues/935)) ([3de4824](https://github.com/uplbtools/room-tba/commit/3de4824a5a676f6058d6611cd1ed867397dcb815)), closes [#905](https://github.com/uplbtools/room-tba/issues/905) [#905](https://github.com/uplbtools/room-tba/issues/905)

# [2.12.0](https://github.com/uplbtools/room-tba/compare/v2.11.2...v2.12.0) (2026-08-04)


### Features

* **social:** surface the UPLB Tools accounts where the app has just helped ([#932](https://github.com/uplbtools/room-tba/issues/932)) ([1019510](https://github.com/uplbtools/room-tba/commit/1019510928d13b8fe46e123764dac99162a62fb0))

## [2.11.2](https://github.com/uplbtools/room-tba/compare/v2.11.1...v2.11.2) (2026-08-04)


### Bug Fixes

* **ci:** bound the E2E connection budget under the pooler cap ([#929](https://github.com/uplbtools/room-tba/issues/929)) ([35bc7d3](https://github.com/uplbtools/room-tba/commit/35bc7d3f924a6dff0915587151fb9318f402b5f5)), closes [#773](https://github.com/uplbtools/room-tba/issues/773) [#766](https://github.com/uplbtools/room-tba/issues/766)

## [2.11.1](https://github.com/uplbtools/room-tba/compare/v2.11.0...v2.11.1) (2026-08-04)


### Bug Fixes

* **map:** credit the basemap that actually served the tiles ([#922](https://github.com/uplbtools/room-tba/issues/922)) ([36aeb16](https://github.com/uplbtools/room-tba/commit/36aeb162840f00dd152e936e8ba1cddefa114809)), closes [#863](https://github.com/uplbtools/room-tba/issues/863) [#883](https://github.com/uplbtools/room-tba/issues/883)
* **settings:** restructure the settings modal into scannable rows ([#919](https://github.com/uplbtools/room-tba/issues/919)) ([8b47a39](https://github.com/uplbtools/room-tba/commit/8b47a39fe175cc20ea811e5630602b6bf2a96aa2))

# [2.11.0](https://github.com/uplbtools/room-tba/compare/v2.10.4...v2.11.0) (2026-08-04)


### Features

* **links:** add the UPLB Tools Facebook and Instagram pages ([#917](https://github.com/uplbtools/room-tba/issues/917)) ([ca09e74](https://github.com/uplbtools/room-tba/commit/ca09e7469787fb98a7af90c5eafc23be6fcb4432))

## [2.10.4](https://github.com/uplbtools/room-tba/compare/v2.10.3...v2.10.4) (2026-08-04)


### Bug Fixes

* **wiki:** make the wiki read like reference material ([#915](https://github.com/uplbtools/room-tba/issues/915)) ([1ad8f0d](https://github.com/uplbtools/room-tba/commit/1ad8f0d87ec8a0cb3fc255a981657105543dd346))

## [2.10.3](https://github.com/uplbtools/room-tba/compare/v2.10.2...v2.10.3) (2026-08-04)


### Bug Fixes

* **dorms:** let gender be null instead of forcing a guess ([#914](https://github.com/uplbtools/room-tba/issues/914)) ([b6b06a1](https://github.com/uplbtools/room-tba/commit/b6b06a1021ffa900b1c0724f714bc2621e9e945c))

## [2.10.2](https://github.com/uplbtools/room-tba/compare/v2.10.1...v2.10.2) (2026-08-04)


### Bug Fixes

* **contributions:** rank public contributors and split the editor board ([#906](https://github.com/uplbtools/room-tba/issues/906)) ([f6c9a66](https://github.com/uplbtools/room-tba/commit/f6c9a660b59612a7bc696cb127f4724c911e1c40))

## [2.10.1](https://github.com/uplbtools/room-tba/compare/v2.10.0...v2.10.1) (2026-08-04)


### Bug Fixes

* **map-chrome:** stop the status bar splitting the pill and unblock the credit links ([#905](https://github.com/uplbtools/room-tba/issues/905)) ([6c1e4c6](https://github.com/uplbtools/room-tba/commit/6c1e4c68960e092496a41151322321be680b6bed)), closes [#893](https://github.com/uplbtools/room-tba/issues/893) [#893](https://github.com/uplbtools/room-tba/issues/893) [#893](https://github.com/uplbtools/room-tba/issues/893)

# [2.10.0](https://github.com/uplbtools/room-tba/compare/v2.9.1...v2.10.0) (2026-08-04)


### Features

* **flora:** add the flora schema and public read endpoint ([#908](https://github.com/uplbtools/room-tba/issues/908)) ([28e23a5](https://github.com/uplbtools/room-tba/commit/28e23a5a640f2e46bd8eab9d327f42e46e3de010))

## [2.9.1](https://github.com/uplbtools/room-tba/compare/v2.9.0...v2.9.1) (2026-08-04)


### Bug Fixes

* **changelog:** backfill 2.4.0-2.7.1 and unblock the version-sync PR ([#890](https://github.com/uplbtools/room-tba/issues/890)) ([dd2b7b8](https://github.com/uplbtools/room-tba/commit/dd2b7b885687251c5a15b8895a4f6725949f9a49)), closes [#809](https://github.com/uplbtools/room-tba/issues/809) [#822](https://github.com/uplbtools/room-tba/issues/822) [#826](https://github.com/uplbtools/room-tba/issues/826) [#831](https://github.com/uplbtools/room-tba/issues/831) [#834](https://github.com/uplbtools/room-tba/issues/834) [#868](https://github.com/uplbtools/room-tba/issues/868) [#868](https://github.com/uplbtools/room-tba/issues/868)

# [2.9.0](https://github.com/uplbtools/room-tba/compare/v2.8.0...v2.9.0) (2026-08-04)


### Features

* **proposals:** add map preview, undo, and shortcuts to the approver queue ([#895](https://github.com/uplbtools/room-tba/issues/895)) ([7f138ac](https://github.com/uplbtools/room-tba/commit/7f138ac84f9809041a336434f23b948f18ae7f54))
* add Tailwind CSS ([95f88ff](https://github.com/uplbtools/room-tba/commit/95f88ff9711515f4018ea03a584af428f9a8352f))

### Bug Fixes

* **map-chrome:** reflow the bottom chrome so no control is clipped at 320px ([#893](https://github.com/uplbtools/room-tba/issues/893)) ([f45e6cc](https://github.com/uplbtools/room-tba/commit/f45e6cc15bc662dffce31cd04285122dd285bc88))
* **proposals:** make the approver queue usable at 59 pending ([#887](https://github.com/uplbtools/room-tba/issues/887)) ([40df657](https://github.com/uplbtools/room-tba/commit/40df65773d7ec375b6369b70dc68f831bf0d3ab4))

# [2.8.0](https://github.com/uplbtools/room-tba/compare/v2.7.1...v2.8.0) (2026-08-04)


### Features

* **settings:** add a Storage section with Resync campus data and Clear cached data ([#882](https://github.com/uplbtools/room-tba/issues/882)) ([91681bc](https://github.com/uplbtools/room-tba/commit/91681bc0a68262905c42696a2d8ade7824f201e8))
* **data:** record editor history for bulk maintenance operations ([#878](https://github.com/uplbtools/room-tba/issues/878)) ([bc34ff4](https://github.com/uplbtools/room-tba/commit/bc34ff42e78240e4f4359b6afe69678d0098a62b))
* **presence:** replace the fabricated online counter with real session presence ([#874](https://github.com/uplbtools/room-tba/issues/874)) ([ed97b4f](https://github.com/uplbtools/room-tba/commit/ed97b4fbcb9f9386eb6064386beca763923ba821))

### Bug Fixes

* **local:** closeLocalDB referenced an undeclared localDB ([626f780](https://github.com/uplbtools/room-tba/commit/626f78001e7acc3d18bc026646ecb445bbd49eea))
* **map:** fall back to a keyless basemap when MapTiler rejects the key ([#883](https://github.com/uplbtools/room-tba/issues/883)) ([49cc328](https://github.com/uplbtools/room-tba/commit/49cc3287d9d77e7adf80cee7d7b7c60ff3db8e07))

### Performance Improvements

* **boot:** defer PGlite and batch the sync probes ([#880](https://github.com/uplbtools/room-tba/issues/880)) ([9168374](https://github.com/uplbtools/room-tba/commit/916837476441339c7257046793fa4350a7acae89))

## [2.7.1](https://github.com/uplbtools/room-tba/compare/v2.7.0...v2.7.1) (2026-08-04)


### Bug Fixes

* **sync:** show a single retry affordance when campus sync fails ([#869](https://github.com/uplbtools/room-tba/issues/869)) ([d837809](https://github.com/uplbtools/room-tba/commit/d8378092db6eb5912c40b3ba154a5db8aa6e4c92))

# [2.7.0](https://github.com/uplbtools/room-tba/compare/v2.6.1...v2.7.0) (2026-08-03)


### Bug Fixes

* **map-chrome:** show OSM and MapTiler credits without a click ([1e86cea](https://github.com/uplbtools/room-tba/commit/1e86cea8814a14d3027d1467b9251d20d51717e7))


### Features

* **classes:** probable location for Room TBA sections ([#846](https://github.com/uplbtools/room-tba/issues/846)) ([#849](https://github.com/uplbtools/room-tba/issues/849)) ([92f063f](https://github.com/uplbtools/room-tba/commit/92f063f49a0bba8532fa987423cc47b46bc3eaff))
* **fork:** campus.config owns terrain, transit, e2e fixtures + fork:init ([#844](https://github.com/uplbtools/room-tba/issues/844)) ([3e1b59c](https://github.com/uplbtools/room-tba/commit/3e1b59c6223cfed85e9fea3f2968fbecd3a93c21))
* **fork:** interactive fork wizard at /fork ([#841](https://github.com/uplbtools/room-tba/issues/841)) ([#843](https://github.com/uplbtools/room-tba/issues/843)) ([4460b43](https://github.com/uplbtools/room-tba/commit/4460b433b6243ec041154519a00251c233c3d56d))
* **fork:** sample campus seed + generic class importer ([#842](https://github.com/uplbtools/room-tba/issues/842)) ([d010246](https://github.com/uplbtools/room-tba/commit/d010246899ec71979b46b9b469640d813a3a9729))
* **map:** measure-route tool with walk/cycle/drive times ([#848](https://github.com/uplbtools/room-tba/issues/848)) ([#851](https://github.com/uplbtools/room-tba/issues/851)) ([cbc7755](https://github.com/uplbtools/room-tba/commit/cbc77551c8c1dfc5c21df9f9d401cf796a25d423)), closes [#847](https://github.com/uplbtools/room-tba/issues/847) [#847](https://github.com/uplbtools/room-tba/issues/847) [#847](https://github.com/uplbtools/room-tba/issues/847)
* **map:** travel-time isochrone tool over vendored campus walk graph ([#847](https://github.com/uplbtools/room-tba/issues/847)) ([#850](https://github.com/uplbtools/room-tba/issues/850)) ([9c787d7](https://github.com/uplbtools/room-tba/commit/9c787d7d8be57f9614c82bda8fa73d9a1603e0ed))
* **today:** one-tap day route with walking totals ([#839](https://github.com/uplbtools/room-tba/issues/839)) ([#845](https://github.com/uplbtools/room-tba/issues/845)) ([abb37e3](https://github.com/uplbtools/room-tba/commit/abb37e3b84180c70a5c07891e3ae812ff31bcfb2))

## [2.6.1](https://github.com/uplbtools/room-tba/compare/v2.6.0...v2.6.1) (2026-07-28)


### Bug Fixes

* **ui:** improve mobile modal readability and add online counter ([#832](https://github.com/uplbtools/room-tba/issues/832)) ([c4d3de1](https://github.com/uplbtools/room-tba/commit/c4d3de15edf58710ed6cefb9131f114d405bf784))

# [2.6.0](https://github.com/uplbtools/room-tba/compare/v2.5.2...v2.6.0) (2026-07-28)


### Features

* **route:** shareable walking routes between two campus places ([#829](https://github.com/uplbtools/room-tba/issues/829)) ([dd17473](https://github.com/uplbtools/room-tba/commit/dd1747313eadbfeeab864c0407a398cf649a40fd)), closes [#651](https://github.com/uplbtools/room-tba/issues/651)

## [2.5.2](https://github.com/uplbtools/room-tba/compare/v2.5.1...v2.5.2) (2026-07-27)


### Bug Fixes

* **seo:** point the site at room-tba.uplb.tools ([e3a0533](https://github.com/uplbtools/room-tba/commit/e3a0533ab72aa8a95393e59de9d4c1561957317d))
* **transit:** make route stops clickable ([0032762](https://github.com/uplbtools/room-tba/commit/00327629f62faac9645987194adb6a89b7c0a60c))

## [2.5.1](https://github.com/uplbtools/room-tba/compare/v2.5.0...v2.5.1) (2026-07-27)


### Bug Fixes

* **pwa:** stop a stale service worker from leaving a blank page ([b4c7c58](https://github.com/uplbtools/room-tba/commit/b4c7c5817b04fa763bd666c4d0fc01e0b5376e8e))
* **ui:** stop settings buttons stretching to full panel width ([defd445](https://github.com/uplbtools/room-tba/commit/defd445b84afabafa4466187ea778e4b5fdda3b8))

# [2.5.0](https://github.com/uplbtools/room-tba/compare/v2.4.0...v2.5.0) (2026-07-27)


### Bug Fixes

* **og:** drop the redundant wordmark headline on the default card ([53ddf10](https://github.com/uplbtools/room-tba/commit/53ddf10584d4d9641b175be3e33581471fa71a09))


### Features

* **announcements:** in-app announcements panel with unread badge ([85c6acd](https://github.com/uplbtools/room-tba/commit/85c6acd22f484d61ab388acc37313d69811f6dc5)), closes [#777](https://github.com/uplbtools/room-tba/issues/777) [#777](https://github.com/uplbtools/room-tba/issues/777)
* **today:** add a Today screen for the day's planned classes ([f2a1174](https://github.com/uplbtools/room-tba/commit/f2a11743ba1c0eb32491cc18a178b149f204214f)), closes [#774](https://github.com/uplbtools/room-tba/issues/774)

# [2.4.0](https://github.com/uplbtools/room-tba/compare/v2.3.1...v2.4.0) (2026-07-26)


### Bug Fixes

* **ci:** stop failing fork PRs on secrets they cannot have ([7adca83](https://github.com/uplbtools/room-tba/commit/7adca83b96e05f302ed0a9bf50c9e4160fc912b4)), closes [#789](https://github.com/uplbtools/room-tba/issues/789)
* **dorms:** require name agreement before rendering a Kubo CTA ([eebd1e9](https://github.com/uplbtools/room-tba/commit/eebd1e96ed029bdf89d6486b3283b0b065155505))
* **e2e:** give every CI e2e run its own database schema ([eec5863](https://github.com/uplbtools/room-tba/commit/eec58630eaaf6a894e1e06420d3cb47413f3c4fb)), closes [#773](https://github.com/uplbtools/room-tba/issues/773)
* **e2e:** keep the drizzle dir lookup lazy for Node-side importers ([f25cd98](https://github.com/uplbtools/room-tba/commit/f25cd982ee4324effa314f56708b359759df1c99))
* **e2e:** make history revert integration test order-independent ([466b865](https://github.com/uplbtools/room-tba/commit/466b8655edd49fa86c98c290412bae3614b20f84)), closes [#756](https://github.com/uplbtools/room-tba/issues/756)
* **e2e:** point the reset list at the renamed 0040 backfill ([9dca8f7](https://github.com/uplbtools/room-tba/commit/9dca8f73f76c6a05f35e2e1c8d3dea920e1a95af))
* **e2e:** stop transit integration test deleting the seeded Playwright stop ([3c2efe5](https://github.com/uplbtools/room-tba/commit/3c2efe5d2721cbb7a94f167ccec7b0c6d8653ca7)), closes [763/#765](https://github.com/uplbtools/room-tba/issues/765)
* exclude /og.png from ISR so OG cards vary by query string ([#651](https://github.com/uplbtools/room-tba/issues/651)) ([9dabf08](https://github.com/uplbtools/room-tba/commit/9dabf084913b453d428d9880329a73ea8dd00a39))
* pre-release review findings ([8132e7e](https://github.com/uplbtools/room-tba/commit/8132e7eca4d23d3258ce80b131aed60cad5a9c06))
* remove duplicate Donate link in site footer ([dcb0af8](https://github.com/uplbtools/room-tba/commit/dcb0af843b5f11e15e62ab00d556aebaf08e36d5))
* stop nav tooltips flashing when the sidebar collapses ([cd8c313](https://github.com/uplbtools/room-tba/commit/cd8c313a740b7955270cf01b12e9d4f0085febac)), closes [#755](https://github.com/uplbtools/room-tba/issues/755)
* **test:** restore the 20s integration timeout ([bc70344](https://github.com/uplbtools/room-tba/commit/bc70344ac2b8769e14dc37ed5b01c1fece41ed48)), closes [#786](https://github.com/uplbtools/room-tba/issues/786)
* **test:** stop DormResult test dialing localhost:3000, fix stale CTA assertions ([6d1a16d](https://github.com/uplbtools/room-tba/commit/6d1a16d78b80ed0233340109d14aaf7fca02a1d0))
* **test:** use the schema-aware client in the cursor pagination suite ([7e5262c](https://github.com/uplbtools/room-tba/commit/7e5262cae2e95d772f56ab120b95d3ae38bc82c6)), closes [#781](https://github.com/uplbtools/room-tba/issues/781)
* **ui:** address skeleton review, drop remount key and guard the room race ([27f81ad](https://github.com/uplbtools/room-tba/commit/27f81ad1f4b00fb4560ba18c35e40fe298a0e626)), closes [#key](https://github.com/uplbtools/room-tba/issues/key)
* **ui:** live-review findings from the pre-release pass ([7545de7](https://github.com/uplbtools/room-tba/commit/7545de785ca7eb614eed614e059f39d40d706eff))


### Features

* **api:** cursor pagination for /api/classes and side-panel consumers ([ef29000](https://github.com/uplbtools/room-tba/commit/ef290004074627de803a16fd90401c1d2bf04c4e)), closes [#412](https://github.com/uplbtools/room-tba/issues/412)
* **calendar:** add academic calendar viewer at /calendar ([#408](https://github.com/uplbtools/room-tba/issues/408)) ([6ad4e0a](https://github.com/uplbtools/room-tba/commit/6ad4e0a1edd0115cf1f1bdeeea1d04460bed9d03)), closes [#335](https://github.com/uplbtools/room-tba/issues/335)
* **dorms:** add verified Kubo listing links ([350aeb1](https://github.com/uplbtools/room-tba/commit/350aeb11043a931dca4563c885dfa2db1ac430a9))
* **dorms:** integrate live Kubo directory for reservation CTAs ([bdb2e66](https://github.com/uplbtools/room-tba/commit/bdb2e669a7a619673ef71c59a48ce614d5c1b0f8))
* **kubo:** update environment config, button layout and placement ([d27b378](https://github.com/uplbtools/room-tba/commit/d27b378b98ff93325de878c01eda06cc3d3bfffc))
* **map:** filled pin glyphs instead of stroke icons ([04d8ea1](https://github.com/uplbtools/room-tba/commit/04d8ea1c2828f54a77695723401e05c3f99f2390))
* **map:** highlight my class buildings + zoom-gated POI pins ([4ac9ca8](https://github.com/uplbtools/room-tba/commit/4ac9ca891ffbd9463c63890a818bb65b28d1cf21))
* **nav:** donate entry in the sidebar contributors group ([ac5ceb9](https://github.com/uplbtools/room-tba/commit/ac5ceb968004ed8fc26ba7a545a804c359f60f8f))
* **ui:** add EntitySkeleton loading states for entity panels ([08c1b44](https://github.com/uplbtools/room-tba/commit/08c1b4470fac0ad21e9df47e15a8f258a5d9767b))
* **wiki:** git-backed authors, history, and Wikipedia-style layout ([6bf239d](https://github.com/uplbtools/room-tba/commit/6bf239d9a86f8fd93065a69259361ddcfd4a9a2a))

## [2.3.1](https://github.com/uplbtools/room-tba/compare/v2.3.0...v2.3.1) (2026-07-21)


### Bug Fixes

* **backup:** install deps before R2 upload ([57b793f](https://github.com/uplbtools/room-tba/commit/57b793f2434da83777c8a7cdb9c9fa2e17b13326))

# [2.3.0](https://github.com/uplbtools/room-tba/compare/v2.2.0...v2.3.0) (2026-07-21)


### Bug Fixes

* **ci:** preload path and biome format for staging CI/E2E ([948e5b3](https://github.com/uplbtools/room-tba/commit/948e5b3db0169f4ab449e45026faa595f80176fd))
* **ci:** resolve integration preload path for bun test ([5490a82](https://github.com/uplbtools/room-tba/commit/5490a82272835b676b066ec50505c45273c503dd))
* **map-tools:** drop leftover Makiling Trail wiring ([e5dc1a1](https://github.com/uplbtools/room-tba/commit/e5dc1a15e762156da4dd5981abcbeaaee84c876c))
* **map:** defer draft-pin easeTo camera move to rAF ([020f8f6](https://github.com/uplbtools/room-tba/commit/020f8f6c1c09fe2b577a5f4f43041a795f8ab8d4))
* **perf:** make desktop-only CSS split viewport-based, not UA-sniffed ([3ec954a](https://github.com/uplbtools/room-tba/commit/3ec954af10e37b9ac6e30720c0606e065b358788))
* **proposals:** harden public submit abuse controls ([#223](https://github.com/uplbtools/room-tba/issues/223)) ([df15a54](https://github.com/uplbtools/room-tba/commit/df15a5438669f302d82e157d6562cc5e719c3205))
* **proposals:** key rate-limit IP bucket by auth state ([2b21546](https://github.com/uplbtools/room-tba/commit/2b21546144d351c7f5182ec372bf6e6a8cb9f2a7))
* **sheet:** handle pointercancel, fix no-op overflow clip, test drag logic ([fa0e6cf](https://github.com/uplbtools/room-tba/commit/fa0e6cfac8456a62b6ec9db581293d1d43332aa2))
* **ui:** polish landing modal layout and privacy footer text ([7e6a300](https://github.com/uplbtools/room-tba/commit/7e6a30064a579cc21a772d0a4171c222b86a9c86))


### Features

* add Makiling Trail overlay with stations ([#716](https://github.com/uplbtools/room-tba/issues/716)) ([56a84eb](https://github.com/uplbtools/room-tba/commit/56a84eb192dd3e797495f754138e0c85df435744))
* **contributions:** track direct editor publishes, expose "my contributions" ([9df8097](https://github.com/uplbtools/room-tba/commit/9df8097f0be5f2873c70d8240d6ee2e28611a177))
* **contributor:** WYSIWYG draft pin preview for suggest addition ([6e9ce6b](https://github.com/uplbtools/room-tba/commit/6e9ce6bda7815aa4e3ecba1936485b167d0be552))
* **donate:** one-time donations via PayMongo checkout ([8156795](https://github.com/uplbtools/room-tba/commit/81567952864f3d92e459b512d6ebac483b89872f))
* donation page with GCash info for UPLB Tools ([#718](https://github.com/uplbtools/room-tba/issues/718)) ([b2568ea](https://github.com/uplbtools/room-tba/commit/b2568ea0cbd875eb4d124fa3fd232fd35d61253b))
* **faq:** student FAQ page with 3D model answers ([2b93ffd](https://github.com/uplbtools/room-tba/commit/2b93ffd6ed6225bd2cc9ed1d5f9259c9f9d38ee9)), closes [#410](https://github.com/uplbtools/room-tba/issues/410)
* Google Maps-style mobile detail sheet drag ([#411](https://github.com/uplbtools/room-tba/issues/411)) ([3816971](https://github.com/uplbtools/room-tba/commit/3816971ec50a8dc05d970d00aa8211eb2aa8a09e))
* **map-tools:** wire Makiling Trail into the Map Tools flyout ([b1846f8](https://github.com/uplbtools/room-tba/commit/b1846f858198e210123290ee55ffc2c78aa16b56))
* **scripts:** add fork:check — scan for UPLB strings a fork must replace ([#707](https://github.com/uplbtools/room-tba/issues/707)) ([46e995e](https://github.com/uplbtools/room-tba/commit/46e995eec16ca8902bd94af5c5694f092fcc21c7))
* **side-panel:** whimsical EntityEmptyState for rooms and classes ([e170675](https://github.com/uplbtools/room-tba/commit/e170675b69cc17dbe476bd91bef35f4fb10cfba0)), closes [#427](https://github.com/uplbtools/room-tba/issues/427)
* **sponsors:** add curated sponsor ad zones, tracking, and funding docs ([92ed2e3](https://github.com/uplbtools/room-tba/commit/92ed2e3c608ab6428890481b01fcfd6fb96a1712))
* **sponsors:** add Kape Kalabaw demo sponsor and fix banner layout ([f1d7b5b](https://github.com/uplbtools/room-tba/commit/f1d7b5b891f14a5c094404f0bc879bb72c330c97))
* **sponsors:** sponsored map pins at real sponsor locations ([4bb6037](https://github.com/uplbtools/room-tba/commit/4bb6037815f1377492a61407a467dd4c95c0b292))


### Performance Improvements

* split desktop-only CSS for mobile users ([#716](https://github.com/uplbtools/room-tba/issues/716)) ([0532ceb](https://github.com/uplbtools/room-tba/commit/0532cebb22a98a587443a7d1d887fa676fee601c))

# [2.2.0](https://github.com/uplbtools/room-tba/compare/v2.1.1...v2.2.0) (2026-07-21)


### Bug Fixes

* **a11y:** image dims, 44px chrome controls, and drawer closes ([94dae9e](https://github.com/uplbtools/room-tba/commit/94dae9e21ff6cedabe5032c07b1d8b3c56a71ccd))
* **a11y:** set width, height, and decoding on key images ([fddc3ab](https://github.com/uplbtools/room-tba/commit/fddc3ab2429c33f4b10e8fa788f21a50b82d19c6))
* **amis:** import RCT/CPT and harden class-row extraction ([0f1478e](https://github.com/uplbtools/room-tba/commit/0f1478ecdcf67ae1021d5d4ff9d87f1ce42fc61a))
* **auth:** stop Turnstile siteverify remoteip false fails ([4b57c75](https://github.com/uplbtools/room-tba/commit/4b57c756ce79f9d6eb4e436f8f98e635ad13d5ca))
* **cache-first:** restore RoomClassesStore after room-scoped merge ([7919d37](https://github.com/uplbtools/room-tba/commit/7919d370f3d7d848c259cda16b40a71430d2b9eb))
* change stacking context of finalExamScreen ([c81ac74](https://github.com/uplbtools/room-tba/commit/c81ac740a1ae404730b1ddf680fa17f4117be87b))
* **css:** use font-display swap for Inter ([15ece7e](https://github.com/uplbtools/room-tba/commit/15ece7e4011f178d1094dc5eb4173ed47ea3c250))
* **editor:** improve suggest form contrast ([883dac2](https://github.com/uplbtools/room-tba/commit/883dac28a3c04502fd43c4bcbe43c3c1ed7e7ac9))
* **editor:** improve suggest form contrast ([822440c](https://github.com/uplbtools/room-tba/commit/822440c3fd4336bdfa4db6ef514150dbcdbaeb92)), closes [#426](https://github.com/uplbtools/room-tba/issues/426) [#238](https://github.com/uplbtools/room-tba/issues/238)
* flex alignment messes up bottom right toolbar ([a87b3e0](https://github.com/uplbtools/room-tba/commit/a87b3e0701555cd845218940f46498737e73b1b2))
* **modal:** open Project Contributors tab reliably ([#679](https://github.com/uplbtools/room-tba/issues/679)) ([27e84e0](https://github.com/uplbtools/room-tba/commit/27e84e066d86ba155d2989382b4ff383ec617cc7)), closes [#683](https://github.com/uplbtools/room-tba/issues/683)
* **offline:** generate PGlite init SQL from drizzle/schema.ts ([3d48f27](https://github.com/uplbtools/room-tba/commit/3d48f27ca7621f780fa44b0d4b50589168676881))
* **planner:** import and group recitation (RCT) sections ([5d31cf7](https://github.com/uplbtools/room-tba/commit/5d31cf7bd174bdf323def98ebf66431135d16302))
* **quick:** change PWA config deny list to view wiki route ([6f9825e](https://github.com/uplbtools/room-tba/commit/6f9825ed95263db8eb8c089bb3a3bc152d2d10ca))
* **room:** keep schedules room-scoped ([cadf084](https://github.com/uplbtools/room-tba/commit/cadf0843aecd79218cdc02d7053069d302407c83)), closes [#301](https://github.com/uplbtools/room-tba/issues/301)
* **sidebar:** keep mobile rail open for settings accordion ([e31c0c3](https://github.com/uplbtools/room-tba/commit/e31c0c34156cb37dba6f07e851f84ba787d48e61))
* **tsconfig:** typecheck scripts and drizzle with path aliases ([ac686d1](https://github.com/uplbtools/room-tba/commit/ac686d11700cfa11e98df325c41b9dc4368af218))
* **ui:** grow side-panel handle and close to 44px targets ([49fce87](https://github.com/uplbtools/room-tba/commit/49fce87d95eeafa3a62ac1589af06f92cac5f6dc))
* **wiki:** bust Cloudflare-poisoned CSS hash for section-times ([c060d84](https://github.com/uplbtools/room-tba/commit/c060d84378fab1edcb050331d15db3688a96f1b3))


### Features

* **agent-tooling:** vend Hallmark skill and apply UI slop fixes ([4ce71de](https://github.com/uplbtools/room-tba/commit/4ce71de6ecd72046f6f9ed00fddbbb31b2c3e4d9))
* **buildings:** add CR facilities list ([27d7610](https://github.com/uplbtools/room-tba/commit/27d7610fec3672c83467893b932d3490e2996b9e))
* **buildings:** CR facilities list — saan may bidet? ([5f50f0f](https://github.com/uplbtools/room-tba/commit/5f50f0f9e8165d6e3dd13eac967bf397ef1d97d3))
* **cache-first:** paint PGlite data before network sync ([#415](https://github.com/uplbtools/room-tba/issues/415)) ([24512d1](https://github.com/uplbtools/room-tba/commit/24512d1a70e356ea642cdf116dafe545c9de0c0d))
* **credits:** add live editor roster ([5b7f46d](https://github.com/uplbtools/room-tba/commit/5b7f46dd2eac31371c9fea95a9bdb99988e4a960))
* **credits:** add live editor roster ([6726abd](https://github.com/uplbtools/room-tba/commit/6726abd2ef80589e745006093c00084c92f0ed6a))
* **data:** add fill-only seed for 2026-07 deep-research findings ([1a5e838](https://github.com/uplbtools/room-tba/commit/1a5e8385da3072617e5b140a0ad1719ebe9f2c95))
* **data:** fill 19 more division website links from report 2 ([bdf8351](https://github.com/uplbtools/room-tba/commit/bdf83519190a613505ca83628b9304a4d9eaa6c9))
* **data:** import roomless class types for class search ([#418](https://github.com/uplbtools/room-tba/issues/418)) ([ffe0c79](https://github.com/uplbtools/room-tba/commit/ffe0c7926bdf0838dcde46b51d6dbac37763b3b8))
* **data:** import roomless class types for search ([c35b6b4](https://github.com/uplbtools/room-tba/commit/c35b6b4211401afb67716cd7600064619dd4c25d))
* **infra:** staging banner via PUBLIC_APP_ENV ([2f6d8cc](https://github.com/uplbtools/room-tba/commit/2f6d8ccbc7c1e26f355ec32fe00acc39b7c34a67))
* **ops:** complete prod backup retention, alerts, and runbook ([17a3dd1](https://github.com/uplbtools/room-tba/commit/17a3dd147192dd5b865f5fd91926c1391b2848be)), closes [#281](https://github.com/uplbtools/room-tba/issues/281)
* **planner:** group course search rows by title ([7ea1e92](https://github.com/uplbtools/room-tba/commit/7ea1e9295838a9391d3f9e6730d1e42243a7c0d8))
* **share:** add premium entity cards and planner pubmat ([810886a](https://github.com/uplbtools/room-tba/commit/810886a00b59b6db0fb99d96551fe180d2090a28))
* **transit:** seed 7 inter-town jeepney/bus routes ([2778e69](https://github.com/uplbtools/room-tba/commit/2778e69220668c4006fbcddab3fceb6d4570d24f))
* **wiki:** add section-time guide ([dd97c99](https://github.com/uplbtools/room-tba/commit/dd97c9901636b381f6bcc9835c6f0b64fd4f7ab6))
* **wiki:** show Room TBA logo at top of wiki pages ([0136777](https://github.com/uplbtools/room-tba/commit/01367770324ec60fdc1fc947a0554e55e15a1d69))

## [2.1.1](https://github.com/uplbtools/room-tba/compare/v2.1.0...v2.1.1) (2026-07-13)


### Bug Fixes

* change stacking context of finalExamScreen ([#673](https://github.com/uplbtools/room-tba/issues/673)) ([6a93e84](https://github.com/uplbtools/room-tba/commit/6a93e848c150c987a8b5d3e31b9349c0608d6b39))

# [1.46.0](https://github.com/uplbtools/room-tba/compare/v1.45.0...v1.46.0) (2026-07-10)


### Bug Fixes

* **map-chrome:** equal-size bottom bar pills; single Messenger link ([2be567e](https://github.com/uplbtools/room-tba/commit/2be567ea215573b0ce5b20414761123467fdf7cc))
* **og:** restore designed social card on home; logo + no em dash on entity cards ([9731e4c](https://github.com/uplbtools/room-tba/commit/9731e4c7e4855761efac6c6a3f31dd90c04de16e))
* **search:** clear pin filter when a result outside its domain is selected ([81f39a4](https://github.com/uplbtools/room-tba/commit/81f39a4b1c2bbae92fbf91c7e59dd51ac1fbb34e))
* **security:** parse hostname instead of unanchored regex in seed link filter ([4401b9c](https://github.com/uplbtools/room-tba/commit/4401b9c08c3260a9dcc16c973dfe0b2d979b5c40))
* **ui:** real logo on splash badge; unscope entity-meta-chip base rule ([e431b05](https://github.com/uplbtools/room-tba/commit/e431b052f619c36586d92fbfe19f9329ee901696))


### Features

* **data:** seed 108 UPLB orgs, offices, and spots from researched directory ([95f26df](https://github.com/uplbtools/room-tba/commit/95f26df1bd1b5739ea2b049471221155f7535c6b))
* **map-chrome:** open suggest-addition as a centered modal, not a FAB popover ([c6b3a88](https://github.com/uplbtools/room-tba/commit/c6b3a886df0fe250336b7f5681a3494a33812558))
* **modal:** split leaderboard and data coverage out of Campus team tab ([d3a15d1](https://github.com/uplbtools/room-tba/commit/d3a15d10c1437bd5bee24b5c7bd67f5520ed54a8))
* **planner:** mobile-first chrome, action icons, browse pagination ([8a5dafd](https://github.com/uplbtools/room-tba/commit/8a5dafd561e75da2a94fbbae300279919c809597))
* **proposals:** reject anonymous submitter names reserved by accounts ([0e52448](https://github.com/uplbtools/room-tba/commit/0e52448f924a5df79b4cf056b468e06c8d5bfe32))
* **ui:** redesign loading splash as brand lockup ([51b1107](https://github.com/uplbtools/room-tba/commit/51b110724a0b6a2675bbd1e2800151c7682ff874)), closes [#app-loading-shell](https://github.com/uplbtools/room-tba/issues/app-loading-shell)

# [1.45.0](https://github.com/uplbtools/room-tba/compare/v1.44.2...v1.45.0) (2026-07-09)


### Bug Fixes

* **map-chrome:** float the mobile map-tools panel below the top bar ([bed84b0](https://github.com/uplbtools/room-tba/commit/bed84b0341765dbfc6b35a14bd1f41864e861c3d))
* **map-chrome:** stop the mobile sheet handle inheriting 4rem height ([268560a](https://github.com/uplbtools/room-tba/commit/268560a1ed617415d68688effd7f5732a55e9d19))
* **planner:** make section drag work on touch ([aae6662](https://github.com/uplbtools/room-tba/commit/aae66627221ce8f8ccefbb8b97af8b550b79aff2))
* **planner:** prevent mobile course-result overlap ([edd32a9](https://github.com/uplbtools/room-tba/commit/edd32a9dec0b938905fc38ad78b0c0aa38ee9686))
* **search:** place browse-chip and term rows in the mobile grid shell ([52d2eda](https://github.com/uplbtools/room-tba/commit/52d2eda89418a1332eccea2f21e29cc5582734fc))


### Features

* **modal:** full changelog in one click; review queue in a large modal ([0dd32aa](https://github.com/uplbtools/room-tba/commit/0dd32aa82c7af492ea184cb5db567cacc0f4aeda))
* **ui:** shared LoadingIndicator and complete button hover coverage ([a02f9a9](https://github.com/uplbtools/room-tba/commit/a02f9a9e868bc4402e3cefcb0108f01ec14c1b3e))


## [1.44.2](https://github.com/uplbtools/room-tba/compare/v1.44.1...v1.44.2) (2026-07-09)


### Bug Fixes

* **ci:** mkdir node_modules before frozen install (flaky ENOENT) ([#633](https://github.com/uplbtools/room-tba/issues/633)) ([52098ca](https://github.com/uplbtools/room-tba/commit/52098ca2a69724de4c610f067e4de731bca7b5ea))


## [1.44.1](https://github.com/uplbtools/room-tba/compare/v1.44.0...v1.44.1) (2026-07-09)


### Bug Fixes

* **ci:** pin bun to 1.3.12 (1.3.14 broke --frozen-lockfile) ([#632](https://github.com/uplbtools/room-tba/issues/632)) ([cc278c9](https://github.com/uplbtools/room-tba/commit/cc278c9d341de7939dc1351375fbba678af52714))


# [1.44.0](https://github.com/uplbtools/room-tba/compare/v1.43.1...v1.44.0) (2026-07-09)


### Features

* **planner:** duplicate/rename plans, image export, all-sections fetch; student-org info modal; surface signup ([#629](https://github.com/uplbtools/room-tba/issues/629)) ([319d9c6](https://github.com/uplbtools/room-tba/commit/319d9c60ed6c267f73a8848cf9bcdc1ad6f010cb))


## [1.43.1](https://github.com/uplbtools/room-tba/compare/v1.43.0...v1.43.1) (2026-07-09)


### Bug Fixes

* **planner:** update planner styling to fix bug ([1066d06](https://github.com/uplbtools/room-tba/commit/1066d0636df963a4a28335eb6a700ef584a681a9))


# [1.43.0](https://github.com/uplbtools/room-tba/compare/v1.42.1...v1.43.0) (2026-07-09)


### Features

* **auth:** contributor self-signup (attribution + username reservation) ([#623](https://github.com/uplbtools/room-tba/issues/623)) ([216813e](https://github.com/uplbtools/room-tba/commit/216813e9e8c2e5638e8d98c6ac0624d3d480b5db))


## [1.42.1](https://github.com/uplbtools/room-tba/compare/v1.42.0...v1.42.1) (2026-07-09)


### Bug Fixes

* **ci:** make pwa-legal guardrail tolerant of the denylist boundary group ([#625](https://github.com/uplbtools/room-tba/issues/625)) ([c195047](https://github.com/uplbtools/room-tba/commit/c1950476562ce0c8882034f4bf800e8178d0a581))


# [1.42.0](https://github.com/uplbtools/room-tba/compare/v1.41.0...v1.42.0) (2026-07-09)


### Features

* **planner:** intentional mobile layout (first pass) ([#621](https://github.com/uplbtools/room-tba/issues/621)) ([79b9dbe](https://github.com/uplbtools/room-tba/commit/79b9dbe2213f70832686a32f689e60a407a390f9))


# [1.41.0](https://github.com/uplbtools/room-tba/compare/v1.40.0...v1.41.0) (2026-07-09)


### Features

* **planner:** add a color legend for block types ([#620](https://github.com/uplbtools/room-tba/issues/620)) ([1dc2ba4](https://github.com/uplbtools/room-tba/commit/1dc2ba4b7638009dda129d37aeb2c9433c25ddba))


# [1.40.0](https://github.com/uplbtools/room-tba/compare/v1.39.0...v1.40.0) (2026-07-09)


### Features

* **planner:** wrap full course title + show change-of-matriculation date ([#618](https://github.com/uplbtools/room-tba/issues/618)) ([c19f455](https://github.com/uplbtools/room-tba/commit/c19f4551d3fc26200b598ce5bae14825a8a6b27b))


# [1.39.0](https://github.com/uplbtools/room-tba/compare/v1.38.1...v1.39.0) (2026-07-09)


### Features

* **og:** dynamic per-URL Open Graph images ([#617](https://github.com/uplbtools/room-tba/issues/617)) ([7a7f0e6](https://github.com/uplbtools/room-tba/commit/7a7f0e64efd5ba8a01a2ea8654e2bccfc343b3cc))


## [1.38.1](https://github.com/uplbtools/room-tba/compare/v1.38.0...v1.38.1) (2026-07-09)


### Bug Fixes

* **terms:** pluralize the term-picker class count correctly ([#616](https://github.com/uplbtools/room-tba/issues/616)) ([87bdeac](https://github.com/uplbtools/room-tba/commit/87bdeac6d72cd57fbbd732d5f37c57b1bf7e80ec))


# [1.38.0](https://github.com/uplbtools/room-tba/compare/v1.37.0...v1.38.0) (2026-07-09)


### Features

* **planner:** link lec/lab in list, fix drag label, clarify saving ([#613](https://github.com/uplbtools/room-tba/issues/613)) ([099c234](https://github.com/uplbtools/room-tba/commit/099c234c66bbaedfba1c577d374174b00682baea))


# [1.37.0](https://github.com/uplbtools/room-tba/compare/v1.36.1...v1.37.0) (2026-07-09)


### Features

* **help:** reach the "How Room TBA works" guide from the App menu ([#6](https://github.com/uplbtools/room-tba/issues/6)) ([d777691](https://github.com/uplbtools/room-tba/commit/d7776919b1d603e84dd0655bed2635da5cf589b9))


# [1.36.0](https://github.com/uplbtools/room-tba/compare/v1.35.2...v1.36.0) (2026-07-09)

### Features

- **account:** include saved planner plans in the data export ([#2](https://github.com/uplbtools/room-tba/issues/2)) ([ff799af](https://github.com/uplbtools/room-tba/commit/ff799af7feb0b580f3356c935b017dfb9332a867))

# [1.35.2](https://github.com/uplbtools/room-tba/compare/v1.35.1...v1.35.2) (2026-07-09)

### Bug Fixes

- **planner:** tile same-timeslot drag ghosts into columns ([#598](https://github.com/uplbtools/room-tba/issues/598)) ([a8ef8e4](https://github.com/uplbtools/room-tba/commit/a8ef8e41be874efad110b3cfced17c7c32e4c9c9))

# [1.35.1](https://github.com/uplbtools/room-tba/compare/v1.35.0...v1.35.1) (2026-07-09)

### Bug Fixes

- **amis:** import parent lectures embedded in child sections ([#597](https://github.com/uplbtools/room-tba/issues/597)) ([440ef07](https://github.com/uplbtools/room-tba/commit/440ef077e5d921a8f0b3e6ab13feb6d8a98eeb26))

# [1.35.0](https://github.com/uplbtools/room-tba/compare/v1.34.0...v1.35.0) (2026-07-09)

### Bug Fixes

- **planner:** GET /account/plans degrades to empty if the table is absent ([dec1785](https://github.com/uplbtools/room-tba/commit/dec178530cd26f95306b86cb09d18ba877c5a0f7))
- **search:** give the term selector its own row so the AY label fits ([020930b](https://github.com/uplbtools/room-tba/commit/020930b51655a8dabc8bc8a5b71d61e3e0b9bb31))

### Features

- **planner:** persist plans to the signed-in account ([#2](https://github.com/uplbtools/room-tba/issues/2)) ([57713d6](https://github.com/uplbtools/room-tba/commit/57713d631be3699e22f49ecbcfe749a616f916f9))

# [1.34.0](https://github.com/uplbtools/room-tba/compare/v1.33.1...v1.34.0) (2026-07-08)

### Bug Fixes

- **room:** show a lab/recit's parent lecture even when it's in another room ([2610267](https://github.com/uplbtools/room-tba/commit/26102670f76472280ce34d17f1492106f939e74c))
- **term:** show academic year in the term selector ("1st sem AY 2026 - 2027") ([cb74284](https://github.com/uplbtools/room-tba/commit/cb742848d1fe2787ad7691690d0f2469d7576ec9))

### Features

- **map:** toggle org/office and place pin layers from the legend ([#18](https://github.com/uplbtools/room-tba/issues/18)b) ([5e9e153](https://github.com/uplbtools/room-tba/commit/5e9e153e8144af3166d167d0d818553b3a43b6cb)), closes [#18b](https://github.com/uplbtools/room-tba/issues/18b)
- **review:** initials avatars for contributors in the review queue ([#7](https://github.com/uplbtools/room-tba/issues/7)) ([0302da5](https://github.com/uplbtools/room-tba/commit/0302da51b7001dc8d6accf8ccf92a1e371234aff))

# [1.33.1](https://github.com/uplbtools/room-tba/compare/v1.33.0...v1.33.1) (2026-07-08)

### Bug Fixes

- **planner:** refetch alternatives when a course is added ([#592](https://github.com/uplbtools/room-tba/issues/592)) ([171a2f0](https://github.com/uplbtools/room-tba/commit/171a2f02b12d23ef7313d5eed613bf395a80866e))

# [1.33.0](https://github.com/uplbtools/room-tba/compare/v1.32.3...v1.33.0) (2026-07-08)

### Features

- **mobile:** drag the details sheet handle to expand/collapse ([#4](https://github.com/uplbtools/room-tba/issues/4)) ([c4e6441](https://github.com/uplbtools/room-tba/commit/c4e6441d3d81340c9c8af41aa3b67ecc9c82927f))

# [1.32.3](https://github.com/uplbtools/room-tba/compare/v1.32.2...v1.32.3) (2026-07-08)

### Bug Fixes

- **pwa:** denylist /planner (and siblings) with query strings ([#588](https://github.com/uplbtools/room-tba/issues/588)) ([eb3feb6](https://github.com/uplbtools/room-tba/commit/eb3feb60430ea1049eeb7fb0dda77aa11b9f3241))

# [1.32.2](https://github.com/uplbtools/room-tba/compare/v1.32.1...v1.32.2) (2026-07-08)

### Bug Fixes

- **update:** show the installed version, not a stale changelog version ([683218a](https://github.com/uplbtools/room-tba/commit/683218ab5f0117332d6c2a805b4097da17d629d4))

# [1.32.1](https://github.com/uplbtools/room-tba/compare/v1.32.0...v1.32.1) (2026-07-08)

### Bug Fixes

- **planner:** pass island props explicitly so /planner opens in prod ([#585](https://github.com/uplbtools/room-tba/issues/585)) ([08708d5](https://github.com/uplbtools/room-tba/commit/08708d532191f9c6cd1ed204db3915da380ea69f))

# [1.32.0](https://github.com/uplbtools/room-tba/compare/v1.31.3...v1.32.0) (2026-07-08)

### Features

- **review:** open the pending-review queue in a modal ([#10](https://github.com/uplbtools/room-tba/issues/10)) ([55cc07d](https://github.com/uplbtools/room-tba/commit/55cc07d24f63a513c2e11134c4c748e590b5cb22)), closes [#9](https://github.com/uplbtools/room-tba/issues/9)

# [1.31.3](https://github.com/uplbtools/room-tba/compare/v1.31.2...v1.31.3) (2026-07-08)

### Bug Fixes

- **offerings:** link recits (and any child section) to their parent lecture ([29c2ffa](https://github.com/uplbtools/room-tba/commit/29c2ffa51e456e4b1e83316bad5a1a956f1787c2))

# [1.31.2](https://github.com/uplbtools/room-tba/compare/v1.31.1...v1.31.2) (2026-07-08)

### Bug Fixes

- **update:** show changelog + confirm before reloading; open changelog anytime ([feb3beb](https://github.com/uplbtools/room-tba/commit/feb3bebc5d39de17f60df541a3f812710c45a9f8))

# [1.31.1](https://github.com/uplbtools/room-tba/compare/v1.31.0...v1.31.1) (2026-07-08)

### Bug Fixes

- **offline-maps:** keep the popover inside the viewport ([#576](https://github.com/uplbtools/room-tba/issues/576)) ([35c68f4](https://github.com/uplbtools/room-tba/commit/35c68f4f627b5f814a4a138b137a8f1fbd10f599))

# [1.31.0](https://github.com/uplbtools/room-tba/compare/v1.30.0...v1.31.0) (2026-07-08)

### Features

- **planner:** reflect planner open state in the /planner URL ([#575](https://github.com/uplbtools/room-tba/issues/575)) ([2217780](https://github.com/uplbtools/room-tba/commit/2217780bfeb3920586d1985e041dbf72a6fc1e17))

# [1.30.0](https://github.com/uplbtools/room-tba/compare/v1.29.2...v1.30.0) (2026-07-08)

### Features

- **review:** batch-approve selected proposals ([#9](https://github.com/uplbtools/room-tba/issues/9)) ([6d9a53f](https://github.com/uplbtools/room-tba/commit/6d9a53f914220b37643f4842d0b30290e7fd4fa2))

# [1.29.2](https://github.com/uplbtools/room-tba/compare/v1.29.1...v1.29.2) (2026-07-08)

### Bug Fixes

- **entry:** read one-shot URL params before child components strip them ([a8e496c](https://github.com/uplbtools/room-tba/commit/a8e496cdb9a41bd5d65a4de27ef2eef08979b830))

# [1.29.1](https://github.com/uplbtools/room-tba/compare/v1.29.0...v1.29.1) (2026-07-08)

### Bug Fixes

- **planner:** exclude /planner from PWA navigate fallback ([#569](https://github.com/uplbtools/room-tba/issues/569)) ([154b30d](https://github.com/uplbtools/room-tba/commit/154b30d2226af0ef5a229d345ebdaf9dc0c60cef))

# [1.29.0](https://github.com/uplbtools/room-tba/compare/v1.28.0...v1.29.0) (2026-07-08)

### Features

- **offline:** include orgs/places in the offline directory download ([55ddbb7](https://github.com/uplbtools/room-tba/commit/55ddbb70ca8b05f2b3eab79a91dca94bb46a7ba3))

# [1.28.0](https://github.com/uplbtools/room-tba/compare/v1.27.0...v1.28.0) (2026-07-08)

### Features

- **directory:** make places (POIs) searchable ([b86464e](https://github.com/uplbtools/room-tba/commit/b86464efd30edb4377bef1c27f3d4e4024f6a62e))

# [1.27.0](https://github.com/uplbtools/room-tba/compare/v1.26.0...v1.27.0) (2026-07-08)

### Features

- **directory:** browsable + searchable campus orgs/offices directory ([#14](https://github.com/uplbtools/room-tba/issues/14)) ([4a1dfd6](https://github.com/uplbtools/room-tba/commit/4a1dfd68b8c0855d91682c9b354855809ce4a9ba)), closes [#537](https://github.com/uplbtools/room-tba/issues/537)

# [1.26.0](https://github.com/uplbtools/room-tba/compare/v1.25.0...v1.26.0) (2026-07-08)

### Bug Fixes

- **copy:** clearer, slop-free labels across planner, search, landing ([2f99baa](https://github.com/uplbtools/room-tba/commit/2f99baa9266f449c7451a43c6d148afdd498c41d)), closes [#1](https://github.com/uplbtools/room-tba/issues/1) [#3](https://github.com/uplbtools/room-tba/issues/3) [#5](https://github.com/uplbtools/room-tba/issues/5) [#8](https://github.com/uplbtools/room-tba/issues/8)
- **e2e-reset:** apply E2E migrations in numeric order ([52e3f94](https://github.com/uplbtools/room-tba/commit/52e3f94993e859cf2744d1811354983d7fc9df3f))
- **map,e2e:** drop past events from the map; fix entity-page test timing ([65336ba](https://github.com/uplbtools/room-tba/commit/65336ba83b9b277c43baaf17a4a2c1c217bc00ff)), closes [#17](https://github.com/uplbtools/room-tba/issues/17)
- **offline-maps:** open popover without dismissing the parent App menu ([39418f5](https://github.com/uplbtools/room-tba/commit/39418f50793f10da8b9dd959c12818b852006141))
- **planner:** one section per course instead of stacking labs ([5976a46](https://github.com/uplbtools/room-tba/commit/5976a46c3474bfe261bf45d1eef72652be07bcec)), closes [#13](https://github.com/uplbtools/room-tba/issues/13)
- **planner:** replaceCourse must not bail when no plan exists yet ([58798b8](https://github.com/uplbtools/room-tba/commit/58798b8e98be300ee62f6b0b9d198d5282a41901)), closes [#13](https://github.com/uplbtools/room-tba/issues/13)
- **search,url-sync,amis:** green URL-sync e2e + schedule fallback ([d8776a5](https://github.com/uplbtools/room-tba/commit/d8776a5ab4e552bf6cdb9f26d55ab33a1d98df73)), closes [#12](https://github.com/uplbtools/room-tba/issues/12)

### Features

- **loading:** blurred campus backdrop instead of a flat white loading screen ([819acc3](https://github.com/uplbtools/room-tba/commit/819acc35c4daaf92149a35939dadab4e42b116e6)), closes [#19](https://github.com/uplbtools/room-tba/issues/19)

# [1.25.0](https://github.com/uplbtools/room-tba/compare/v1.24.0...v1.25.0) (2026-07-08)

### Bug Fixes

- **leaderboard:** drop bot-key auth gate on public read endpoint ([5099337](https://github.com/uplbtools/room-tba/commit/509933703240d60234af6d7b4b6a66e36cd093c0))
- **leaderboard:** return a JSON 500 instead of an unhandled throw ([ef80145](https://github.com/uplbtools/room-tba/commit/ef8014530896d68661ef21ed207f537254dd01ff))
- **planner:** render Thursday classes and lectures for uppercase day tokens ([3e85203](https://github.com/uplbtools/room-tba/commit/3e85203884b2952568bf8b9caff427af10f8fc34))
- **planner:** sync term selector to global state, replace native delete confirm ([18edfbd](https://github.com/uplbtools/room-tba/commit/18edfbdb4c63e034439950893718d5c5975438e6))
- **search:** render campus browse chips in the default (unfocused) state ([87cbc4c](https://github.com/uplbtools/room-tba/commit/87cbc4c269320746fd94da443637498ea444d8db))
- **search:** restore the map term selector removed by the search restructure ([b7ad884](https://github.com/uplbtools/room-tba/commit/b7ad8847797c97626f54cbf8354260205b43c543))
- **status-bar:** restore editor sign-in action dropped by index shift ([9101bac](https://github.com/uplbtools/room-tba/commit/9101bacc17b6a43d458dfba71f65793a7f9e4f42))
- **status-bar:** widen StatusBarLinkGroups onAction to the full action-id union ([7f960cf](https://github.com/uplbtools/room-tba/commit/7f960cfee028b2b63c57f7b3534bcc44801788b1))

### Features

- **buildings:** let a building be both admin and a class venue ([5b669eb](https://github.com/uplbtools/room-tba/commit/5b669eb61a2fce6416689301c843bda167fcf413))
- **leaderboard:** medal + avatar leaderboard panel redesign ([6723fae](https://github.com/uplbtools/room-tba/commit/6723fae53993a5b7ae3627c2e2ba268bb1a574a8))
- **search:** pin Planner as an always-visible chip ([c33ff70](https://github.com/uplbtools/room-tba/commit/c33ff70e6b87fe53e40c0d455666a6706e80c6f8))
- **status-bar:** compact status pill and de-sprawled bottom bar ([42a965f](https://github.com/uplbtools/room-tba/commit/42a965f534bd725a8b025f87028a5c457521921a))

# [1.24.0](https://github.com/uplbtools/room-tba/compare/v1.23.2...v1.24.0) (2026-07-08)

### Bug Fixes

- **places:** await getPlaceById in updatePlace fallback for consistency ([b173ecb](https://github.com/uplbtools/room-tba/commit/b173ecb41057ed02d18bfc07ea7cf1c515aa92fb))

### Features

- **orgs:** admin + crowdsource backend for organizations ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 3) ([d754425](https://github.com/uplbtools/room-tba/commit/d75442533b2f43415f835db1e7a7a357a942279d))
- **orgs:** admin create/update API routes for organizations ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 3) ([7ffe2aa](https://github.com/uplbtools/room-tba/commit/7ffe2aa1c23ab4a4ee713820d973fbba34d922ac))
- **orgs:** map pins, detail panel, building reverse-lookup ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 3) ([a0f8cc2](https://github.com/uplbtools/room-tba/commit/a0f8cc2b1dddef4cb22ba703c28a7247a9e4fc8f))
- **orgs:** organization/office directory data foundation ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 3) ([5b7ccd7](https://github.com/uplbtools/room-tba/commit/5b7ccd75f484e2c42b2caa610f0ea2018a3b26be))
- **places:** crowdsourced create/update via proposals ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 2) ([7d30c17](https://github.com/uplbtools/room-tba/commit/7d30c17f42e622d61fda905d057d8b6dc27362c0))
- **places:** inline editor in PlaceResult ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 2 complete) ([0c0e142](https://github.com/uplbtools/room-tba/commit/0c0e142b3afea83616d280e96942e7581b8f4c92))
- **places:** map pins + detail panel ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 2) ([12580e1](https://github.com/uplbtools/room-tba/commit/12580e12f7a04b56e8996143ce8b3e9b232f5c5c))
- **places:** POI entity data layer + API ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 2) ([6d00dd5](https://github.com/uplbtools/room-tba/commit/6d00dd5953ccce6020c410a3fbd8eeb03dd62286))
- **places:** sync orchestration + context wiring ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 2) ([863d766](https://github.com/uplbtools/room-tba/commit/863d766e02725aa1f5bbd9357bfa0c4e8b3b3ee8))
- **rooms:** room purpose categories ([#537](https://github.com/uplbtools/room-tba/issues/537) Phase 1) ([3a98410](https://github.com/uplbtools/room-tba/commit/3a98410aef34eec91449b7a817c84d0162bc2302))

# [1.23.2](https://github.com/uplbtools/room-tba/compare/v1.23.1...v1.23.2) (2026-07-08)

### Bug Fixes

- remove automatic opening of suggestions when opened ([731ae56](https://github.com/uplbtools/room-tba/commit/731ae565a7cfc6e2343d63ff673e94ad3b12ce32))

# [1.23.1](https://github.com/uplbtools/room-tba/compare/v1.23.0...v1.23.1) (2026-07-08)

### Bug Fixes

- scrolling bug in planner squishes list ([3b9a000](https://github.com/uplbtools/room-tba/commit/3b9a0004b82486ca8f6241499296de67ab05d7e8))
- update onMount import which causes prod error ([526046f](https://github.com/uplbtools/room-tba/commit/526046fcd670294f3ddb0e7797dbf06ed8cdab6f)), closes [#519](https://github.com/uplbtools/room-tba/issues/519)

# [1.23.0](https://github.com/uplbtools/room-tba/compare/v1.22.0...v1.23.0) (2026-07-07)

### Bug Fixes

- **e2e:** unbreak post-[#503](https://github.com/uplbtools/room-tba/issues/503) e2e suite — boot races and buried drawer handle ([#531](https://github.com/uplbtools/room-tba/issues/531)) ([9aaf672](https://github.com/uplbtools/room-tba/commit/9aaf672e4d973fc63296e6a17536ab24b7b80e5c))
- **security:** harden account tokens, sessions, and review flows ([#529](https://github.com/uplbtools/room-tba/issues/529)) ([b64ed8f](https://github.com/uplbtools/room-tba/commit/b64ed8fd313d925a029e947d34583d532dc06ef3)), closes [#admin-login-error](https://github.com/uplbtools/room-tba/issues/admin-login-error)

### Features

- **planner:** core plan model, conflicts, share codec, ICS, store ([#504](https://github.com/uplbtools/room-tba/issues/504)) ([86e3e69](https://github.com/uplbtools/room-tba/commit/86e3e69cbe2532cec31b0bd0524505cbd3df110a))
- **planner:** course planner UI — grid, share links, finals, ICS export ([#505](https://github.com/uplbtools/room-tba/issues/505)) ([b9a91e9](https://github.com/uplbtools/room-tba/commit/b9a91e91ff9194b6f8a6883616790792c1b15ecc)), closes [#506](https://github.com/uplbtools/room-tba/issues/506)

# [1.21.0](https://github.com/uplbtools/room-tba/compare/v1.20.0...v1.21.0) (2026-07-03)

### Features

- **community:** Messenger role links and brand icons ([#217](https://github.com/uplbtools/room-tba/issues/217), [#406](https://github.com/uplbtools/room-tba/issues/406)) ([8b21958](https://github.com/uplbtools/room-tba/commit/8b21958f7b16851aa994e58eb097414eab0740fa))
- **notifications:** emit proposal.reviewed on admin approve/reject/changes ([#464](https://github.com/uplbtools/room-tba/issues/464)) ([369a52e](https://github.com/uplbtools/room-tba/commit/369a52e328696a77dacb9588f5038e97ec913856)), closes [#222](https://github.com/uplbtools/room-tba/issues/222)

# [1.17.1](https://github.com/uplbtools/room-tba/compare/v1.17.0...v1.17.1) (2026-06-29)

### Bug Fixes

- **store:** compile runes module as index.svelte.ts ([67acd53](https://github.com/uplbtools/room-tba/commit/67acd535a9410e94c44625bb824dc23131c45ecf)), closes [#295](https://github.com/uplbtools/room-tba/issues/295)

# [1.17.0](https://github.com/uplbtools/room-tba/compare/v1.16.0...v1.17.0) (2026-06-29)

### Bug Fixes

- **ci:** restore semantic-release npmPublish false and drop git plugin ([61f2f9a](https://github.com/uplbtools/room-tba/commit/61f2f9ace2667b361f649166ee86465f1fa6c7d8)), closes [#357](https://github.com/uplbtools/room-tba/issues/357)
- **ui:** repair store split build and overlay click regressions ([625949e](https://github.com/uplbtools/room-tba/commit/625949e6cfb8e48e640c78f852e7c004f09b1f70))
- **ui:** restore browse modal chips, drawer layout, event action row ([#339](https://github.com/uplbtools/room-tba/issues/339) [#319](https://github.com/uplbtools/room-tba/issues/319)) ([#369](https://github.com/uplbtools/room-tba/issues/369)) ([47bfeea](https://github.com/uplbtools/room-tba/commit/47bfeea574ade89ef0f95b699b8f205b47f4d6e4))

### Features

- **admin:** entity merge pipeline for buildings, colleges, divisions, dorms ([50a1dca](https://github.com/uplbtools/room-tba/commit/50a1dca4b1d82f8da330b7766450671886d6cc84)), closes [#273](https://github.com/uplbtools/room-tba/issues/273) [#273](https://github.com/uplbtools/room-tba/issues/273)
- **batch:** 10 medium/high-priority tickets — deps, sync, admin, docs ([#365](https://github.com/uplbtools/room-tba/issues/365)) ([67943be](https://github.com/uplbtools/room-tba/commit/67943be064c014cd5c81afe2c5d129526bf0fb96)), closes [medium/hi#priority](https://github.com/medium/hi/issues/priority) [#281](https://github.com/uplbtools/room-tba/issues/281) [#229](https://github.com/uplbtools/room-tba/issues/229) [#216](https://github.com/uplbtools/room-tba/issues/216) [#161](https://github.com/uplbtools/room-tba/issues/161) [#281](https://github.com/uplbtools/room-tba/issues/281) [#229](https://github.com/uplbtools/room-tba/issues/229) [#216](https://github.com/uplbtools/room-tba/issues/216) [#161](https://github.com/uplbtools/room-tba/issues/161) [#283](https://github.com/uplbtools/room-tba/issues/283) [#285](https://github.com/uplbtools/room-tba/issues/285) [#332](https://github.com/uplbtools/room-tba/issues/332) [#333](https://github.com/uplbtools/room-tba/issues/333) [#334](https://github.com/uplbtools/room-tba/issues/334) [#341](https://github.com/uplbtools/room-tba/issues/341) [#169](https://github.com/uplbtools/room-tba/issues/169) [#231](https://github.com/uplbtools/room-tba/issues/231) [#205](https://github.com/uplbtools/room-tba/issues/205) [#231](https://github.com/uplbtools/room-tba/issues/231) [#205](https://github.com/uplbtools/room-tba/issues/205) [#155](https://github.com/uplbtools/room-tba/issues/155)
- **batch:** 10 small tickets — telemetry, schedule, middleware, stacking, tests ([#363](https://github.com/uplbtools/room-tba/issues/363)) ([633bce5](https://github.com/uplbtools/room-tba/commit/633bce5452fe22ce47549f2d76bb8145a5738c53)), closes [#237](https://github.com/uplbtools/room-tba/issues/237) [#241](https://github.com/uplbtools/room-tba/issues/241) [#302](https://github.com/uplbtools/room-tba/issues/302) [#270](https://github.com/uplbtools/room-tba/issues/270) [#241](https://github.com/uplbtools/room-tba/issues/241) [#302](https://github.com/uplbtools/room-tba/issues/302) [#313](https://github.com/uplbtools/room-tba/issues/313) [#270](https://github.com/uplbtools/room-tba/issues/270) [#247](https://github.com/uplbtools/room-tba/issues/247) [#263](https://github.com/uplbtools/room-tba/issues/263) [#247](https://github.com/uplbtools/room-tba/issues/247) [#263](https://github.com/uplbtools/room-tba/issues/263)
- **batch:** 15 issues — hover preview, build cache, merge pipeline, campus partners, dark mode, contributor profiles, dev credits, class refresh, events, visual pass, editor pins, proposals ([#388](https://github.com/uplbtools/room-tba/issues/388)) ([24c985f](https://github.com/uplbtools/room-tba/commit/24c985f83114ee7a42eed0584b178d25a75aa573)), closes [#288](https://github.com/uplbtools/room-tba/issues/288) [#331](https://github.com/uplbtools/room-tba/issues/331) [#273](https://github.com/uplbtools/room-tba/issues/273) [#257](https://github.com/uplbtools/room-tba/issues/257) [#264](https://github.com/uplbtools/room-tba/issues/264) [#248](https://github.com/uplbtools/room-tba/issues/248) [#381](https://github.com/uplbtools/room-tba/issues/381) [#310](https://github.com/uplbtools/room-tba/issues/310) [#275](https://github.com/uplbtools/room-tba/issues/275) [#274](https://github.com/uplbtools/room-tba/issues/274) [#287](https://github.com/uplbtools/room-tba/issues/287) [#254](https://github.com/uplbtools/room-tba/issues/254) [#247](https://github.com/uplbtools/room-tba/issues/247) [#238](https://github.com/uplbtools/room-tba/issues/238) [#255](https://github.com/uplbtools/room-tba/issues/255)
- **batch:** 5 small tickets — pin validation, schedule theme, PWA install, changelog, offline ([#354](https://github.com/uplbtools/room-tba/issues/354)) ([0f0e027](https://github.com/uplbtools/room-tba/commit/0f0e027866a32aa4823ad0d2fd0e2687e13fce7a)), closes [#283](https://github.com/uplbtools/room-tba/issues/283) [#240](https://github.com/uplbtools/room-tba/issues/240) [#213](https://github.com/uplbtools/room-tba/issues/213) [#212](https://github.com/uplbtools/room-tba/issues/212) [#101](https://github.com/uplbtools/room-tba/issues/101)
- **batch:** class browse, ops guards, sync, aliases, backup ([#367](https://github.com/uplbtools/room-tba/issues/367)) ([0aefc94](https://github.com/uplbtools/room-tba/commit/0aefc94b965c8da22861463e411c6f1f6bfbba57)), closes [#281](https://github.com/uplbtools/room-tba/issues/281) [#229](https://github.com/uplbtools/room-tba/issues/229) [#216](https://github.com/uplbtools/room-tba/issues/216) [#161](https://github.com/uplbtools/room-tba/issues/161) [#281](https://github.com/uplbtools/room-tba/issues/281) [#229](https://github.com/uplbtools/room-tba/issues/229) [#216](https://github.com/uplbtools/room-tba/issues/216) [#161](https://github.com/uplbtools/room-tba/issues/161) [#283](https://github.com/uplbtools/room-tba/issues/283) [#285](https://github.com/uplbtools/room-tba/issues/285) [#332](https://github.com/uplbtools/room-tba/issues/332) [#333](https://github.com/uplbtools/room-tba/issues/333) [#334](https://github.com/uplbtools/room-tba/issues/334) [#341](https://github.com/uplbtools/room-tba/issues/341) [#169](https://github.com/uplbtools/room-tba/issues/169) [#231](https://github.com/uplbtools/room-tba/issues/231) [#205](https://github.com/uplbtools/room-tba/issues/205) [#231](https://github.com/uplbtools/room-tba/issues/231) [#205](https://github.com/uplbtools/room-tba/issues/205) [#155](https://github.com/uplbtools/room-tba/issues/155) [#155](https://github.com/uplbtools/room-tba/issues/155)
- **contributor-progress:** building and room completeness dashboard ([#315](https://github.com/uplbtools/room-tba/issues/315)) ([282098a](https://github.com/uplbtools/room-tba/commit/282098a28e481c05db225ce62ec800a4536c59f6))
- **final-exams:** viewer, schema, import, and room panel ([#327](https://github.com/uplbtools/room-tba/issues/327)) ([b87f110](https://github.com/uplbtools/room-tba/commit/b87f110d1eed1279c8c80e7adea0a327c7b83547))
- **opt:** seamless bootstrap, offline toasts, latency health, perf spot-check ([#336](https://github.com/uplbtools/room-tba/issues/336) [#101](https://github.com/uplbtools/room-tba/issues/101) [#313](https://github.com/uplbtools/room-tba/issues/313) [#263](https://github.com/uplbtools/room-tba/issues/263)) ([#372](https://github.com/uplbtools/room-tba/issues/372)) ([f5063ba](https://github.com/uplbtools/room-tba/commit/f5063baa34f1b736fa8ef1157d7fbb1e29493810))
- **opt:** seamless bootstrap, offline toasts, latency health, perf spot-check ([#336](https://github.com/uplbtools/room-tba/issues/336) [#101](https://github.com/uplbtools/room-tba/issues/101) [#313](https://github.com/uplbtools/room-tba/issues/313) [#263](https://github.com/uplbtools/room-tba/issues/263)) ([#372](https://github.com/uplbtools/room-tba/issues/372)) ([#373](https://github.com/uplbtools/room-tba/issues/373)) ([ee225e7](https://github.com/uplbtools/room-tba/commit/ee225e775796bc4c350c30e899bc2ee9cd71c39a))
- **schedule-route:** import personal schedule and multi-stop routing ([#329](https://github.com/uplbtools/room-tba/issues/329)) ([c0205c7](https://github.com/uplbtools/room-tba/commit/c0205c7a81e3450a25f9271f03d94a598e19be78))
- **ui:** overlay stacking, PWA guards, changelog overview ([#302](https://github.com/uplbtools/room-tba/issues/302), [#321](https://github.com/uplbtools/room-tba/issues/321)-323, [#212](https://github.com/uplbtools/room-tba/issues/212)) ([f4a0c8b](https://github.com/uplbtools/room-tba/commit/f4a0c8b42160f394cf333e0943061d4c61f4a7df)), closes [#321-323](https://github.com/uplbtools/room-tba/issues/321-323) [#322](https://github.com/uplbtools/room-tba/issues/322) [#323](https://github.com/uplbtools/room-tba/issues/323)

# [1.16.0](https://github.com/uplbtools/room-tba/compare/v1.15.0...v1.16.0) (2026-06-29)

### Features

- **batch:** 5 small tickets — pin validation, schedule theme, PWA install, changelog, offline ([#354](https://github.com/uplbtools/room-tba/issues/354)) ([#355](https://github.com/uplbtools/room-tba/issues/355)) ([89969c1](https://github.com/uplbtools/room-tba/commit/89969c169795f0880a1ea4f92a753ea5d9adb9c7)), closes [#283](https://github.com/uplbtools/room-tba/issues/283) [#240](https://github.com/uplbtools/room-tba/issues/240) [#213](https://github.com/uplbtools/room-tba/issues/213) [#212](https://github.com/uplbtools/room-tba/issues/212) [#101](https://github.com/uplbtools/room-tba/issues/101)

# [1.15.0](https://github.com/uplbtools/room-tba/compare/v1.14.0...v1.15.0) (2026-06-29)

### Features

- **ui:** sync copy, action chips, LEC/LAB grouping ([#338](https://github.com/uplbtools/room-tba/issues/338), [#319](https://github.com/uplbtools/room-tba/issues/319), [#301](https://github.com/uplbtools/room-tba/issues/301)) ([ec503e5](https://github.com/uplbtools/room-tba/commit/ec503e53fc6d698dd7f5cd9f0d67dac86fb91504))

# [1.14.0](https://github.com/uplbtools/room-tba/compare/v1.13.1...v1.14.0) (2026-06-29)

### Bug Fixes

- **pwa:** load legal pages outside fallback ([5571e79](https://github.com/uplbtools/room-tba/commit/5571e7939f0e58e430bf2c6cdc602c344ab6e601))
- **schedule:** bind canvas element ref instead of getElementById ([8738719](https://github.com/uplbtools/room-tba/commit/873871910ad2b27243414c072b17e1dd221adb76)), closes [#330](https://github.com/uplbtools/room-tba/issues/330)
- **search:** make recent search remove button work ([28454da](https://github.com/uplbtools/room-tba/commit/28454da4b209c8b4a2d55c60b6f0c1c52b36d764)), closes [#326](https://github.com/uplbtools/room-tba/issues/326)
- **ui:** close jeepney stop panel when query changes ([ff86769](https://github.com/uplbtools/room-tba/commit/ff86769d771ada9ece6d6913c87562f24df333a7)), closes [#324](https://github.com/uplbtools/room-tba/issues/324)
- **ux:** open Contributors on Campus team tab ([dae07dd](https://github.com/uplbtools/room-tba/commit/dae07dd0cb4e16bc365ca13e98a3513baf4f5c40)), closes [#320](https://github.com/uplbtools/room-tba/issues/320)

### Features

- **batch:** 5 small tickets — refresh, class counts, transit exclusivity, stop panel, z-index fix ([#344](https://github.com/uplbtools/room-tba/issues/344)) ([6b8eb45](https://github.com/uplbtools/room-tba/commit/6b8eb4583e9d4fb353b4392160fd722d5ce16aa9)), closes [#340](https://github.com/uplbtools/room-tba/issues/340) [#337](https://github.com/uplbtools/room-tba/issues/337) [#342](https://github.com/uplbtools/room-tba/issues/342) [#324](https://github.com/uplbtools/room-tba/issues/324) [#339](https://github.com/uplbtools/room-tba/issues/339)

# [1.13.1](https://github.com/uplbtools/room-tba/compare/v1.13.0...v1.13.1) (2026-06-28)

### Bug Fixes

- **amis:** correct CRS term IDs and harden import pipeline ([a93b89e](https://github.com/uplbtools/room-tba/commit/a93b89ee472e820e522105184ee1451cb4582555))

# [1.13.0](https://github.com/uplbtools/room-tba/compare/v1.12.0...v1.13.0) (2026-06-28)

### Bug Fixes

- **copy:** repair terms typos and finish em-dash cleanup ([bf3ae16](https://github.com/uplbtools/room-tba/commit/bf3ae1655d7cdf30a492158d2def128384812f25))
- **map:** tighten map chrome layout and mobile panel exclusivity ([8a3974e](https://github.com/uplbtools/room-tba/commit/8a3974e71119f5ef75281b420c3f91b6ec58f561))
- **ui:** improve entity detail panels on mobile and narrow widths ([70e511e](https://github.com/uplbtools/room-tba/commit/70e511e061e1ea3ac4e1a816accf8bcff8baaddf))
- **ui:** keep term selector visible in map edit mode ([5229493](https://github.com/uplbtools/room-tba/commit/5229493c0b5c4f0b1d8bfea0e6cb51bc22898f6f))

### Features

- AMIS class import, term calendar, and map UI fixes ([#314](https://github.com/uplbtools/room-tba/issues/314)) ([7ec9f02](https://github.com/uplbtools/room-tba/commit/7ec9f02d1ef9b2d9360330d45924f10a2fb5d597))
- **amis:** add import pipeline with sanitized local cache ([b046501](https://github.com/uplbtools/room-tba/commit/b04650146fd035435430e94edf10ffcd53a5b090))
- **db:** add term calendar migrations and midyear fixes ([9b2778f](https://github.com/uplbtools/room-tba/commit/9b2778f7f737ecc2058141cfbe5f7b01ab14f9ec))
- **ui:** polish term selector and add jeepney stop modal ([1684b13](https://github.com/uplbtools/room-tba/commit/1684b136852a5e75855347f137162ee32ab8821e))
- **ui:** sync term selection through URLs and static entity pages ([4a45d10](https://github.com/uplbtools/room-tba/commit/4a45d10f24e99fe8587f1cb20441691fb39a70c0))

# [1.12.0](https://github.com/uplbtools/room-tba/compare/v1.11.0...v1.12.0) (2026-06-28)

### Features

- **chrome:** legal pages, community links, and status bar rework ([#303](https://github.com/uplbtools/room-tba/issues/303)) ([39ace06](https://github.com/uplbtools/room-tba/commit/39ace060a779c054dab089443774837200b70e36))

# [1.11.0](https://github.com/uplbtools/room-tba/compare/v1.10.0...v1.11.0) (2026-06-28)

### Bug Fixes

- **a11y:** fix clipped focus rings and unify action chip hovers ([07ff6cb](https://github.com/uplbtools/room-tba/commit/07ff6cbb3ab1559b7bad3b67c14fd9cb239ce71d))
- **a11y:** improve map UI accessibility for dialogs and panels ([e4c3c21](https://github.com/uplbtools/room-tba/commit/e4c3c213a3b566fdd3dd4e66005cbe2b46250d6f))
- **contributor:** hide event propose name field until propose is clicked ([865c220](https://github.com/uplbtools/room-tba/commit/865c2208e5110366c8753d038f5244116a0cf6cd))
- **dorms:** harden amenity parsing for quoted Postgres arrays ([224f07d](https://github.com/uplbtools/room-tba/commit/224f07d0004c5114752470dd3005674065e1e7eb))
- **dorms:** strip quote wrappers from amenity chips ([d5cc921](https://github.com/uplbtools/room-tba/commit/d5cc92150235dca13479727193124d88ec76d1f3))
- **map-chrome:** clarify status bar directions progress and catalog date ([e999233](https://github.com/uplbtools/room-tba/commit/e9992333b89b8255ef3260a15878a9832cf82ac3))
- **map-chrome:** collapse status bar details by default on narrow layouts ([1206df4](https://github.com/uplbtools/room-tba/commit/1206df4a533960002b82f7f5cf96001f67900e72))
- **map-chrome:** fix attribution expand lifting FABs and dedupe editor entry ([11a1756](https://github.com/uplbtools/room-tba/commit/11a17560ec27c87758a5f70fdbd729090221af1d))
- **map-chrome:** fix bottom gradient leaking map pixels ([4e8b549](https://github.com/uplbtools/room-tba/commit/4e8b549e2d479528e02c477bae2997790941c890))
- **map-chrome:** fix map tools mode row and restore campus tour toggle ([7578d37](https://github.com/uplbtools/room-tba/commit/7578d37dc320e0d8f00868d276d1eec66ddd669f))
- **map-chrome:** fix map tools panel positioning after motion pass ([a01d04c](https://github.com/uplbtools/room-tba/commit/a01d04c9a2efb9cdf15fbce60c93b5061b3ae258))
- **map-chrome:** fix mobile padding and FAB placement ([848d43b](https://github.com/uplbtools/room-tba/commit/848d43b471b35ca6bdbc8c2469faf85777c1fb09))
- **map-chrome:** prevent editor shelf clip in search chrome ([6b42d0d](https://github.com/uplbtools/room-tba/commit/6b42d0d1884180070411e5123a95860b3f3d0c16))
- **map-chrome:** remove hover-triggered scrollbar from search chip row ([78d1550](https://github.com/uplbtools/room-tba/commit/78d1550777c941062e5c3b4791437970a9cc2ef6))
- **map-chrome:** remove unnecessary horizontal scroll from map tools ([016b1cd](https://github.com/uplbtools/room-tba/commit/016b1cd6ca532fad926f1f808a104b968e73c49b))
- **map-chrome:** restore spacious mobile map tools sheet ([0ab45bb](https://github.com/uplbtools/room-tba/commit/0ab45bbeb9a98e71cbce44e3cdc99ddf59ba134b))
- **map-chrome:** restore two-row expanded status bar with sync transparency ([3aa63d2](https://github.com/uplbtools/room-tba/commit/3aa63d2e38bb4621f35dbedc47af2fc8b57bb46d))
- **map:** align compass icon when map bearing is north ([1c530b1](https://github.com/uplbtools/room-tba/commit/1c530b1227ac429fb0f8267f865c4cc1424b3dea))
- **map:** hide 3D building extrusions in flat 2D view ([5400f15](https://github.com/uplbtools/room-tba/commit/5400f1515d3688b420a68595b66a2ee4211c1143))
- **map:** raise building pins above events and dedupe pin labels ([3d278cb](https://github.com/uplbtools/room-tba/commit/3d278cb62af0989aea2eb14992dccbe8b8869dcb))
- **map:** remove dead campus tour control that broke hydration ([939fc9d](https://github.com/uplbtools/room-tba/commit/939fc9dba8cd42094fc777b47c4f38384102456b))
- **map:** set basemap preset to warm stone not neutral greige ([c6b6dd8](https://github.com/uplbtools/room-tba/commit/c6b6dd85b05926e6d20b2ce5f1c6f2a9786b4802))
- **security:** harden image URL validation and layout observer crash ([9b10199](https://github.com/uplbtools/room-tba/commit/9b1019995cec2b808fa8dabecd989cb3a7f560ef))
- **ui:** dismiss loading shell when hydration fails to start ([b8cd003](https://github.com/uplbtools/room-tba/commit/b8cd003eb107843003932f43adf472c4239fc699))
- **ui:** fix bootstrap loading overlay that never dismisses ([52a7c00](https://github.com/uplbtools/room-tba/commit/52a7c00f97e2c17e3fefaabf6b145899eed585e6))
- **ui:** landing modal tabs and stale events cache on boot ([01a91fa](https://github.com/uplbtools/room-tba/commit/01a91fa00292a1d1e3ea31dbce3909c8558f1056))

### Features

- **api:** add term-aware class queries and GET /api/terms ([9f897c8](https://github.com/uplbtools/room-tba/commit/9f897c8d79bcb5b0715d65d27b25df033bd0b0b9))
- **contributor:** replace Google Forms links with in-app propose flow ([896bbb2](https://github.com/uplbtools/room-tba/commit/896bbb23fda6c115f43e0f0b3066348251be886d))
- **db:** add terms table and seed UPLB semesters ([6d5b82f](https://github.com/uplbtools/room-tba/commit/6d5b82fef27f771d6fe3653935c470874a1f1694))
- **editor:** foundation refactor and map chrome componentization ([8d4cfa4](https://github.com/uplbtools/room-tba/commit/8d4cfa461ab5ad7adac1f0ba749d2e27358dfc86))
- **editor:** move tools to top-bar chip, shelf, and add-to-map modal ([327dd07](https://github.com/uplbtools/room-tba/commit/327dd07da68464ae7d2f31b41058858764c03509))
- **editor:** open dashboard full-screen on mobile ([533e1ff](https://github.com/uplbtools/room-tba/commit/533e1ff789a0233eeec870f9400021e751000170))
- **events:** add Cloudflare R2 image upload for event photos ([a58708b](https://github.com/uplbtools/room-tba/commit/a58708b3bc88c01ea65cb4c2734ad1b5eff7bf74))
- **events:** include campus date in map pin labels ([54edf54](https://github.com/uplbtools/room-tba/commit/54edf541cb2f5b1f6235fbf6901f0aece6a4a3bc))
- **map-chrome:** add functional motion transitions ([c229b2e](https://github.com/uplbtools/room-tba/commit/c229b2ea74b1901271d227739c1ab46ab44ceb57))
- **map-chrome:** unify bottom tray, transit chip, Supabase, and event images ([267e6e9](https://github.com/uplbtools/room-tba/commit/267e6e9d8ca2e5b52a367ddf587a485cbda3adc3))
- **map:** gate auto-rotate behind opt-in and motion policy ([ac3bc81](https://github.com/uplbtools/room-tba/commit/ac3bc81923a27539902fecb156383572b11c3311))
- **map:** sync entity selection to canonical browser URLs ([cec355e](https://github.com/uplbtools/room-tba/commit/cec355e7535ad3891184d04d78c6b6f3214d498a))
- **side-panel:** add copy-link actions for room and dorm panels ([ba5b19d](https://github.com/uplbtools/room-tba/commit/ba5b19d9c4ad8f263004c6e5de382cd4bdc74dc7))
- **store:** add term selection and room class cache ([0b9ec4a](https://github.com/uplbtools/room-tba/commit/0b9ec4af2cec98a0c52243b53e26d9afe5727a7d))
- **ui:** add term selector to expanded status bar ([df119a5](https://github.com/uplbtools/room-tba/commit/df119a577591737cf50d0168851ca3e4dd295ae3))
- **ui:** filter room schedule by active term ([185c83d](https://github.com/uplbtools/room-tba/commit/185c83df13cf23c1a6f23ee839cac0cea4aae9a9))
- **ui:** show loading state while campus data sync is pending ([6626e80](https://github.com/uplbtools/room-tba/commit/6626e8039021e94844dddf842fd0ef3c2ae13917))
- **ui:** show map immediately and sync campus data in background ([902a038](https://github.com/uplbtools/room-tba/commit/902a03830f6d401553c31431b92d57c535d45889))

# [1.10.0](https://github.com/uplbtools/room-tba/compare/v1.9.0...v1.10.0) (2026-06-25)

### Bug Fixes

- **auth:** rename isAdmin store flag to isLoggedIn ([#203](https://github.com/uplbtools/room-tba/issues/203)) ([f18a160](https://github.com/uplbtools/room-tba/commit/f18a160234c85db586a2c565c410a31da3b1eb52))
- **ci:** do not fail release when version sync PR is blocked ([6170b5b](https://github.com/uplbtools/room-tba/commit/6170b5ba44121b9f7d4edde22598554ba866b916))
- **proposals:** harden approval flow, entity checks, and GET access ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([b5e9573](https://github.com/uplbtools/room-tba/commit/b5e957368be5714fd876f453b8aad3b837babb65))
- **pwa:** raise Workbox precache limit for AppRoot bundle ([447212c](https://github.com/uplbtools/room-tba/commit/447212c1bc320773b74d23bb9eadf3e20b8b619f))
- **search:** unblock typing after event selection and stale room fallback ([8e58322](https://github.com/uplbtools/room-tba/commit/8e583228f1a7e085fc838536bff80c6dd38a9f2f))
- **ui:** improve landing modal scroll and backdrop blur ([bdd4944](https://github.com/uplbtools/room-tba/commit/bdd4944d31fac510c3516504fa43efeab5ad9146))

### Features

- **auth:** add multi-user editor sessions and publish role gates ([#203](https://github.com/uplbtools/room-tba/issues/203)) ([a86c3c3](https://github.com/uplbtools/room-tba/commit/a86c3c34e82efe6038cd293671fd517bc2eefed8))
- **db:** add admin_users and edit_proposals schema migrations ([610150c](https://github.com/uplbtools/room-tba/commit/610150c4d26158eefe25347207169ad254e2643b)), closes [#203](https://github.com/uplbtools/room-tba/issues/203) [#208](https://github.com/uplbtools/room-tba/issues/208)
- **editor:** add admin POST routes for direct entity creation ([a0b9246](https://github.com/uplbtools/room-tba/commit/a0b9246bf25e8aa348ecaa19a1c1d0ab4404837a))
- **editor:** add create affordances in publisher shield menu ([e3ad02a](https://github.com/uplbtools/room-tba/commit/e3ad02a13f9edd79ed9571e0e8d1439d34b2df6e))
- **proposals:** add addition proposal store and event placement state ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([b676581](https://github.com/uplbtools/room-tba/commit/b6765817022c7736cc4c4a2801372f4d5359f6f3))
- **proposals:** add admin create helpers for new entities ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([16387e0](https://github.com/uplbtools/room-tba/commit/16387e08888b4a0c37c2e9a810dbe94340f55659))
- **proposals:** add client helpers for create proposals ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([f988fd6](https://github.com/uplbtools/room-tba/commit/f988fd635f89cf4821222451b71ed60b0a1d320f))
- **proposals:** add edit proposal service and API routes ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([cfa62d3](https://github.com/uplbtools/room-tba/commit/cfa62d301ec74281dfbf980832bfafa4ac7e80e4))
- **proposals:** add map UI for proposing new campus entities ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([71239e2](https://github.com/uplbtools/room-tba/commit/71239e2ba509a1679d9754210bad231e71af7bc6))
- **proposals:** add suggest-edit UI, review panel, and map pin proposals ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([30c6d80](https://github.com/uplbtools/room-tba/commit/30c6d80b28238d459de13cbdf01ab9659260aaef))
- **proposals:** support create proposals in service and review UI ([#208](https://github.com/uplbtools/room-tba/issues/208)) ([a600947](https://github.com/uplbtools/room-tba/commit/a600947a88db04b45c07417f1b84f7a51271bb8a))
- **rooms:** detect duplicate names and offer in-app merge ([489da72](https://github.com/uplbtools/room-tba/commit/489da723ef01d04de9d0bb213b0a15158f990952))
- **taxonomy:** link divisions to parent colleges ([e81e509](https://github.com/uplbtools/room-tba/commit/e81e509139cf474ce0dc6bfbd2742234b5b0dd2a))

# [1.9.0](https://github.com/uplbtools/room-tba/compare/v1.8.0...v1.9.0) (2026-06-25)

### Bug Fixes

- **ci:** repair release workflow version read step ([3c18283](https://github.com/uplbtools/room-tba/commit/3c182837748ddea250f91ff74724a03f2b5265dc))
- map attribution chrome and offline alias cache ([#207](https://github.com/uplbtools/room-tba/issues/207) [#155](https://github.com/uplbtools/room-tba/issues/155) follow-ups) ([8b47748](https://github.com/uplbtools/room-tba/commit/8b47748ace8df8268c34f74ce24212decaf4cd57))

### Features

- attribution, SEO, offline fallbacks, and alias search ([#207](https://github.com/uplbtools/room-tba/issues/207) [#128](https://github.com/uplbtools/room-tba/issues/128) [#169](https://github.com/uplbtools/room-tba/issues/169) [#155](https://github.com/uplbtools/room-tba/issues/155)) ([29b702c](https://github.com/uplbtools/room-tba/commit/29b702c9ee7b12ca55afe23ba7639d5316d69a2e))

# [1.8.0](https://github.com/uplbtools/room-tba/compare/v1.7.3...v1.8.0) (2026-06-25)

### Bug Fixes

- **3d:** align Building3DViewer imports with renamed building-3d exports ([8b1ac80](https://github.com/uplbtools/room-tba/commit/8b1ac806f23feea329c0f88d9ce9181c67e0ffc2))
- add actionable error messages and help text to admin login ([667104a](https://github.com/uplbtools/room-tba/commit/667104a221ac2c11cfeb88f0b37a3123709769aa))
- add left join to rooms table ([52bf086](https://github.com/uplbtools/room-tba/commit/52bf08684411ae07aa730b30a95465922a188115))
- add prerender=false to all admin pages ([78c81ff](https://github.com/uplbtools/room-tba/commit/78c81ff197e3d30cac82f87077432b391eca5179))
- add retractable result sidebars ([fbda15e](https://github.com/uplbtools/room-tba/commit/fbda15ecb58f94f73461c5cfb7cd2c5189329b18))
- allow pin selection in edit mode ([e655a98](https://github.com/uplbtools/room-tba/commit/e655a980c11b4f0d4a48e2eaed90add92838af0a))
- cap offline tile prefetch to the source maxzoom ([b9ccbd5](https://github.com/uplbtools/room-tba/commit/b9ccbd51d12d93ad73c2c20652da8a42e119e535))
- **ci:** make semantic-release work with protected main. ([1106651](https://github.com/uplbtools/room-tba/commit/1106651ecf72ae80ada4c6f6524e495165ce5586))
- clean up map UI controls ([3931744](https://github.com/uplbtools/room-tba/commit/39317448dd172c0296382fda4d62148f5c2bacbb))
- commenting code causes parsing error ([6778849](https://github.com/uplbtools/room-tba/commit/6778849ae477705fbfbff966d89f1ea9e67cc744))
- enlarge map control tap targets to 44px on mobile ([d810f53](https://github.com/uplbtools/room-tba/commit/d810f5380723882e5305d817ef4dfd42531980b4))
- filter by map place categories ([b1c3de7](https://github.com/uplbtools/room-tba/commit/b1c3de70afc86a726d90d134412c97a9e5a3341a))
- harden 3d room position editor ([7810ee7](https://github.com/uplbtools/room-tba/commit/7810ee7dd7ecc0cc389e83ba0b260bd8b50df524))
- keep edit toolbar clear of side panel ([b3fb4a7](https://github.com/uplbtools/room-tba/commit/b3fb4a7550bab400d745c4e9280443ceb54c20da))
- keep map control panels exclusive ([2a25961](https://github.com/uplbtools/room-tba/commit/2a25961cc5d03d5a1edb037c9ab48fd1929f3dc3))
- keep status bar anchored under overlays ([1f22c7b](https://github.com/uplbtools/room-tba/commit/1f22c7ba25255620310b3136b788a2af935d3134))
- **map:** drop accidental jeepney WIP from event-dim hotfix. ([17fd200](https://github.com/uplbtools/room-tba/commit/17fd2002465ed1c3d0ae748733b7baf76ee9a0dc))
- **map:** remove orphan editor WIP that breaks a clean checkout. ([b707fa7](https://github.com/uplbtools/room-tba/commit/b707fa77859db622fa4dcd73c8be7acc278a4457))
- move the offline-ready toast clear of the bottom bar ([7413d77](https://github.com/uplbtools/room-tba/commit/7413d774fc11dc9192013f615312f52a4dadc36f)), closes [#pwa-toast](https://github.com/uplbtools/room-tba/issues/pwa-toast)
- pin Vercel build runtime ([b0c3e2e](https://github.com/uplbtools/room-tba/commit/b0c3e2ec58dee45025ccd93d4a8d8a53496788eb))
- pre-merge safety fixes for offline versions and map chrome. ([bafcbe5](https://github.com/uplbtools/room-tba/commit/bafcbe5c3713294f0ac33a716d2dbe41b21b1741))
- precache the app shell so the PWA works offline ([ee7503f](https://github.com/uplbtools/room-tba/commit/ee7503f6c3ece39bae9b769aad6ffac03f699db4))
- prevent version label overflow in the status bar ([#171](https://github.com/uplbtools/room-tba/issues/171)) ([c8fa4f0](https://github.com/uplbtools/room-tba/commit/c8fa4f0cc9dc2d801a6c72775602a5d77aa1ead6))
- remove duplicate osm attribution ([b8d03a5](https://github.com/uplbtools/room-tba/commit/b8d03a5fb9a0e96463685e41fdc9cb2fdbe01dd2))
- restore 3D map pitch and zoom to pre-refactor values ([fa9893c](https://github.com/uplbtools/room-tba/commit/fa9893c2b353ec09d6eaa95efd13dd8af5916b71)), closes [#148](https://github.com/uplbtools/room-tba/issues/148)
- restore flat map after terrain toggle ([6b8bfbb](https://github.com/uplbtools/room-tba/commit/6b8bfbbafe02b817ddf331abad7edfcccc6d82bf))
- **review:** make the mobile drawer handle more discoverable ([3714d05](https://github.com/uplbtools/room-tba/commit/3714d053dbac47f05dc4a1a0f04f2ed1f06ab812))
- **review:** tighten offline download size estimate ([9763f62](https://github.com/uplbtools/room-tba/commit/9763f621ebcd845453e1f91a59ae41a68c942e19))
- stabilize entity prerender routes ([8f3b191](https://github.com/uplbtools/room-tba/commit/8f3b1914c6c2d5ba2b219a19058c5c83edee4d9c))
- **ui:** align event copy-link buttons with sidepanel actions. ([f9d9638](https://github.com/uplbtools/room-tba/commit/f9d9638de348cc7d11fa30aa408de642db30f991))
- **ui:** anchor mobile detail sheet below search and map tools. ([74d7516](https://github.com/uplbtools/room-tba/commit/74d751676e229fd86b30bcf9b81e2d98ff5c0030))
- **ui:** dim unrelated pins on event focus and mobile edge chrome. ([f31e0ea](https://github.com/uplbtools/room-tba/commit/f31e0ea216809ba8e833fed14816da4df3d85026))
- **ui:** keep offline maps visible in the status bar. ([a473365](https://github.com/uplbtools/room-tba/commit/a4733651a5d50c162418a7e915db35b52d3db24e))
- **ui:** restore mobile entity detail sheet above status bar. ([08f3b72](https://github.com/uplbtools/room-tba/commit/08f3b7273131dc9f65ac20c045070e7d2b3087e8))
- **ui:** shrink mobile search header with inline campus events. ([2ce8b8e](https://github.com/uplbtools/room-tba/commit/2ce8b8eadb56e5e1080493c8fa85bff4c6a004fe))
- **ui:** unify search chrome radius and toggle alignment. ([f7f465b](https://github.com/uplbtools/room-tba/commit/f7f465b4e6b7a8fcb1a64d57af592cf9e9aaf527))
- update array naming ([f620f5b](https://github.com/uplbtools/room-tba/commit/f620f5bf004e6fb677eaf2efdfe9d484003c481f))
- update college sync ([0d0e888](https://github.com/uplbtools/room-tba/commit/0d0e8889b7a586aff581eacf094aa2cac5d6c35a))
- update context object and derivation ([6715a83](https://github.com/uplbtools/room-tba/commit/6715a83f44e79b89d03f123fce365934aea3fa7c))
- update sw.js destination ([4d881d8](https://github.com/uplbtools/room-tba/commit/4d881d82e517b36b95854a1ec5371a5cddd2e1f4))
- update type field and change variable naming ([e276547](https://github.com/uplbtools/room-tba/commit/e276547354db9c120526ed4848730d50061fa648))
- use supported Vercel node runtime ([5457503](https://github.com/uplbtools/room-tba/commit/5457503a492911f865352925453c3e11ea59830e))

### Features

- add API routes for data in DB ([777ece1](https://github.com/uplbtools/room-tba/commit/777ece129e5cf740d9c356eb0d29147b3ec6871d))
- add building copy links ([24f3ab2](https://github.com/uplbtools/room-tba/commit/24f3ab2ec16340b43924b427def541ab2430d0e9))
- add building type filter ([9eb2377](https://github.com/uplbtools/room-tba/commit/9eb2377b92ec272718833db86f2bbe7d47b86a9d))
- add building-type to buildings table ([c703d14](https://github.com/uplbtools/room-tba/commit/c703d146adf07b39937d4620d90c69de653f2861))
- add data fetching for on-demand data querying ([db54279](https://github.com/uplbtools/room-tba/commit/db542796d0b40b29219a7e0826ae2e8d2b405f64))
- add data fetching for on-demand data querying ([95c55cc](https://github.com/uplbtools/room-tba/commit/95c55ccd41fd406507034ae28afd0dd71c15fe7a))
- add dorms ([1f2a94a](https://github.com/uplbtools/room-tba/commit/1f2a94abe04ec643bda6bedfe11ec2138a1e48bd))
- add fields to check sync ([a8e7f32](https://github.com/uplbtools/room-tba/commit/a8e7f32fd04b9e7889e5276f463940d29b6622ef))
- add function for getting dorms ([f9865b0](https://github.com/uplbtools/room-tba/commit/f9865b011fba3334a725482a761edb3e78dca160))
- add functionality for room search and viewing ([2b7153a](https://github.com/uplbtools/room-tba/commit/2b7153a9499674f47d8356f549e3382878122507))
- add functionality to local data sync ([504c670](https://github.com/uplbtools/room-tba/commit/504c670bb3783d593e75c91d3bcdea3b437029ff))
- add helper for client and move pgliteDB file ([c9679a8](https://github.com/uplbtools/room-tba/commit/c9679a8ea175b13b3082d77fa461d16e089e7e3f))
- add indicator for syncing ([7c33f25](https://github.com/uplbtools/room-tba/commit/7c33f258431548da145ac34aa75affd8449228cd))
- add inline room side panel editor ([e509853](https://github.com/uplbtools/room-tba/commit/e5098537a2135f8266db4cdba1f5cef51aecfe8e))
- add Makiling terrain mode ([4903e9c](https://github.com/uplbtools/room-tba/commit/4903e9cd61b0694779e094ddef8770d233f5f25f))
- add map orientation controls (2D toggle, rotate, tilt, reset north) ([afd302f](https://github.com/uplbtools/room-tba/commit/afd302f5c3fbdd3844bfcea0ce9e1287312c2f68)), closes [#173](https://github.com/uplbtools/room-tba/issues/173) [#174](https://github.com/uplbtools/room-tba/issues/174)
- add map orientation controls (2D toggle, rotate, tilt, reset north) ([9154abd](https://github.com/uplbtools/room-tba/commit/9154abdfef4a04360b1f56b15e3290b4be8257ab)), closes [#173](https://github.com/uplbtools/room-tba/issues/173) [#174](https://github.com/uplbtools/room-tba/issues/174)
- add native event support ([30b6d4f](https://github.com/uplbtools/room-tba/commit/30b6d4ff48c92d731b5945b6ada7dd32fa1f0f16))
- add new API endpoints ([578ece2](https://github.com/uplbtools/room-tba/commit/578ece2e9291d193a892bdaa63c72c53946d76b1))
- add new mechanism for data syncing ([6e74f0f](https://github.com/uplbtools/room-tba/commit/6e74f0f9007757f0a399094c3ecd2ea93bfdeb70))
- add pgLite for local data storage ([6669db7](https://github.com/uplbtools/room-tba/commit/6669db7d84837dcb94fad9fef6866ccb47a29774))
- add predicate function logic ([f2908c3](https://github.com/uplbtools/room-tba/commit/f2908c3cb9f30f2e2e6220bff93a554c54f18279))
- add responsive styling to sync toast ([a6f636a](https://github.com/uplbtools/room-tba/commit/a6f636acef38ef6a818c8c9148e321d32a98279e))
- add RoomPosition type ([120c025](https://github.com/uplbtools/room-tba/commit/120c025e257ee6f2b8df798dde42cf30a3442720))
- add services for backend ([9f626e3](https://github.com/uplbtools/room-tba/commit/9f626e30fcca75695484652a89d4d43d23637091))
- add syncBuilding function ([9a90e69](https://github.com/uplbtools/room-tba/commit/9a90e69f8a1c05775429a6606a39a41f8534dc1a))
- add terrain hillshade shadows ([752f3a5](https://github.com/uplbtools/room-tba/commit/752f3a593e841ad21077c04556a87dfa6622e416))
- add updateTable schema ([7df2d81](https://github.com/uplbtools/room-tba/commit/7df2d81cd91ca7a55c06727d0a38934f12724415))
- add utility fn and update type ([d8fb99e](https://github.com/uplbtools/room-tba/commit/d8fb99ee3f5907c691d9125f80210fa48dc75226))
- add utility function for checking the environment ([3d0a4ce](https://github.com/uplbtools/room-tba/commit/3d0a4ceba29613c73a6a65c3e19dcb1c4f2a8a28))
- add utils for syncing data ([a75927c](https://github.com/uplbtools/room-tba/commit/a75927ce9feb20ca9755ba7e291d6247b870748b))
- add versioned map editor updates ([429f14c](https://github.com/uplbtools/room-tba/commit/429f14c107dfe51075bda273941974458ff7db0b))
- add versioned room admin updates ([b5c6f72](https://github.com/uplbtools/room-tba/commit/b5c6f72e659526918d4cba2de3da511b8b260b30))
- add visual map editor with draggable pins ([c348321](https://github.com/uplbtools/room-tba/commit/c348321eaa636aa2a82e181005f1eb1c45d16154))
- add whacky loading spinner ([7bb74a6](https://github.com/uplbtools/room-tba/commit/7bb74a67c57644842e1d8cc766d9d3bd91e1365b))
- change sitemap generator ([b91dcf2](https://github.com/uplbtools/room-tba/commit/b91dcf223f036c8c9f244dd536529f7ab972d21b))
- create new Store to use for toast ([7519e52](https://github.com/uplbtools/room-tba/commit/7519e52771ed77f492e0ca53e71556ed2e14758c))
- **map:** 3D building viewer with OSM footprint and mock room placements ([ebb0eb0](https://github.com/uplbtools/room-tba/commit/ebb0eb0888baf7991329371be88768f7321f5b08))
- **map:** add draggable building indicators for admins ([e8c4c46](https://github.com/uplbtools/room-tba/commit/e8c4c468ecf9c8d77a3ea5a2dbc54184a0de2672))
- offline campus map download with progress and data size ([dbf8ef9](https://github.com/uplbtools/room-tba/commit/dbf8ef9e9af906f55fdeba3bf3c7c018675ae28f))
- scaffold editor GUI for non-technical room/building management ([839c27e](https://github.com/uplbtools/room-tba/commit/839c27e39274e545f9054b29d0694559d42c714d))
- sidebar retraction as a full-height sliding drawer ([#181](https://github.com/uplbtools/room-tba/issues/181)) ([c235d0d](https://github.com/uplbtools/room-tba/commit/c235d0d04da5b32510163a02b7268263b7d2b3ae))
- update api route for rooms ([167ed83](https://github.com/uplbtools/room-tba/commit/167ed83e322560938690a593330e47076bec8d18))
- update connection database connection and adapter ([d8fe6c6](https://github.com/uplbtools/room-tba/commit/d8fe6c65537788afc72d982422dac89d3745a658))
- update db schema ([7fb806a](https://github.com/uplbtools/room-tba/commit/7fb806a4b931bbc6cde3690fc1bc5bae9c91841d))
- update drizzle config to cloud db ([06a5e82](https://github.com/uplbtools/room-tba/commit/06a5e82000581be43e921b203704531d5b79ee65))
- update finalized classes in Room TBA ([dcd08a8](https://github.com/uplbtools/room-tba/commit/dcd08a892ec9c597ec46b1e3cd74657fced20126))
- update imports and update client directive ([f6d9c98](https://github.com/uplbtools/room-tba/commit/f6d9c98eec09f918f8f4bfc9a4d55b17e2f4c1d2))
- update jeepney routes ([110394a](https://github.com/uplbtools/room-tba/commit/110394aaaa38b51e6536e57cd858dd3d321cab66))
- update map styling ([00a3a0e](https://github.com/uplbtools/room-tba/commit/00a3a0eb96e3f3c44182e64c6020838f0a5e9fed))
- update map styling ([7e81c39](https://github.com/uplbtools/room-tba/commit/7e81c39a567d6bca1d0f7d94e313ed8b4b50fd16))
- update type field ([c7e6526](https://github.com/uplbtools/room-tba/commit/c7e65267da6789d7c8775e0ac9f0d7cddbd6e5ec))

## [1.7.3](https://github.com/smmariquit/room-tba/compare/v1.7.2...v1.7.3) (2026-06-11)

### Bug Fixes

- remove invalid comment headers from JSON files ([68cbe95](https://github.com/smmariquit/room-tba/commit/68cbe95e847900a21c5426cdb58caa4845b290e1))

## [1.7.2](https://github.com/smmariquit/room-tba/compare/v1.7.1...v1.7.2) (2026-06-11)

### Bug Fixes

- acknowledge where 3D building models come from ([811ae15](https://github.com/smmariquit/room-tba/commit/811ae158e73f4b8e13b1d484b8aaa3409b810d96))
- add largest campus to landing modal description ([1040b6d](https://github.com/smmariquit/room-tba/commit/1040b6d594d0313988c46bca3a2a20dddba2db29))

## [1.7.1](https://github.com/smmariquit/room-tba/compare/v1.7.0...v1.7.1) (2026-06-10)

### Bug Fixes

- update date of update ([cd46811](https://github.com/smmariquit/room-tba/commit/cd46811739dcf43fdc799829e96d467a6475806e))

# [1.7.0](https://github.com/smmariquit/room-tba/compare/v1.6.0...v1.7.0) (2026-06-10)

### Bug Fixes

- acknowledge where 3D building models come from ([811bd89](https://github.com/smmariquit/room-tba/commit/811bd8959cfcb70d2b9c124b7f9c76bc0ddd4555))
- change visibility of suggestions to avoid cluttering half of the map ([d754926](https://github.com/smmariquit/room-tba/commit/d7549266b5dba5cdf3c88813818638f628ba89de))
- **dorms:** polish UI, add socials/maps, filter, remove 5 dorms ([821954c](https://github.com/smmariquit/room-tba/commit/821954c5db05cf087c375d5d498068a1dc6f0dac))
- remove waypoints when the map is not pointing to building ([808b25d](https://github.com/smmariquit/room-tba/commit/808b25d5a24b509958187c9247225141a2176bb0))
- revised logo ([4068c9c](https://github.com/smmariquit/room-tba/commit/4068c9ce69cd3d7483ccb9298d93321a25e1b730))
- **seo:** prevent static pages from being cached to prevent large PWA load ([9829b9d](https://github.com/smmariquit/room-tba/commit/9829b9dd1ea67b79c3e9af395eb62815fd74e1c4))

### Features

- add jeepney route menu with mock Kaliwa/Kanan and Forestry routes ([caa6ed3](https://github.com/smmariquit/room-tba/commit/caa6ed3e823b8d17d923807ea6b832cef0f26705))
- add messenger contact link to status bar ([fa923f3](https://github.com/smmariquit/room-tba/commit/fa923f357dad8f0bfeeeccfd7963b763e50cd972))
- add messenger redirect ([b14b822](https://github.com/smmariquit/room-tba/commit/b14b8226488d6319bb83b148463e04561532704c))
- add new classes and seeding file ([8f5d2ae](https://github.com/smmariquit/room-tba/commit/8f5d2ae67d6c1efcd95753965595590069e96314))
- add x button to give users the option to remove the options ([f8db089](https://github.com/smmariquit/room-tba/commit/f8db08920ad5db102c61a884cfec44400aa60a1f))
- **dorms:** add UPLB dormitory feature with UP-managed and private dorms ([b74b247](https://github.com/smmariquit/room-tba/commit/b74b247c591be7190bf6d634bab91d8ac839044d))
- **map:** highlight dataset buildings yellow on 3D OSM map ([74d3a07](https://github.com/smmariquit/room-tba/commit/74d3a07a860e4a06cd05c025e8ac848b5ca54f55))
- **seo:** add crawlable entity pages ([89de2f1](https://github.com/smmariquit/room-tba/commit/89de2f110d203fc5c74650ee4105c8daaaad18f1))
- update status bar ([2f99c0a](https://github.com/smmariquit/room-tba/commit/2f99c0a9de88bc6349e8f3ceb13bf7d5fa91bd9a))

# [1.6.0](https://github.com/smmariquit/room-tba/compare/v1.5.0...v1.6.0) (2026-05-08)

### Bug Fixes

- change visibility of suggestions to avoid cluttering half of the map ([3103d51](https://github.com/smmariquit/room-tba/commit/3103d5123dd8dcc962f8e47314d05a0c66af9328))
- remove waypoints when the map is not pointing to building ([d3a462d](https://github.com/smmariquit/room-tba/commit/d3a462dca74c521feffa78b14ea29bbd6b38ec5a))

### Features

- add jeepney route menu with mock Kaliwa/Kanan and Forestry routes ([98fb7e8](https://github.com/smmariquit/room-tba/commit/98fb7e8ad0b9cd2dda7c16a4e761c596ae8d390a))
- add x button to give users the option to remove the options ([2ace62b](https://github.com/smmariquit/room-tba/commit/2ace62b67db3d2a733e7b8877b7678bd6866f250))

# [1.5.0](https://github.com/smmariquit/room-tba/compare/v1.4.0...v1.5.0) (2026-05-08)

### Features

- **map:** highlight dataset buildings yellow on 3D OSM map ([6b573c0](https://github.com/smmariquit/room-tba/commit/6b573c0282f12978b42f9269c366de4cfaa94fff))

# [1.4.0](https://github.com/smmariquit/room-tba/compare/v1.3.1...v1.4.0) (2026-05-01)

### Features

- add messenger contact link to status bar ([2a6d822](https://github.com/smmariquit/room-tba/commit/2a6d822f0d9b23073f3cc9b8ddc34d29700fcd7b))
- add messenger redirect ([bda4177](https://github.com/smmariquit/room-tba/commit/bda417718264db438cec65c9b590536a572ba05c))

## [1.3.1](https://github.com/smmariquit/room-tba/compare/v1.3.0...v1.3.1) (2026-04-23)

### Bug Fixes

- add padding to map when navigating ([0eb16b2](https://github.com/smmariquit/room-tba/commit/0eb16b2f2c79036f128f49c3e7f125b54b72c911))

# [1.3.0](https://github.com/smmariquit/room-tba/compare/v1.2.2...v1.3.0) (2026-04-22)

### Bug Fixes

- change minZoom and update map style ([e51bbda](https://github.com/smmariquit/room-tba/commit/e51bbdae6d44e6491c2ba1480c9a6d0ad371b36b))
- update map bounds ([f02e7db](https://github.com/smmariquit/room-tba/commit/f02e7dbbe7651ce1bc44e2e64790dccdd94ad426))

### Features

- Add veterinary hospital building ([9f0426a](https://github.com/smmariquit/room-tba/commit/9f0426adacfa71eb268d235853e5df591bc7512b))
- update flyout ([708e944](https://github.com/smmariquit/room-tba/commit/708e944121dec1120fd92b2e8a005066f01929ab))

## [1.2.2](https://github.com/smmariquit/room-tba/compare/v1.2.1...v1.2.2) (2026-04-22)

### Bug Fixes

- remove shrink property from icon to prevent a smaller arrow ([1c0c3f5](https://github.com/smmariquit/room-tba/commit/1c0c3f564910153ac2b90d477a3fb06576d74968))
- update progress bar styling for compatibility ([a21fbb5](https://github.com/smmariquit/room-tba/commit/a21fbb521f78c3eb89edca9685462a1e90827127))

## [1.2.1](https://github.com/smmariquit/room-tba/compare/v1.2.0...v1.2.1) (2026-04-18)

### Bug Fixes

- resolve missing images on landing page ([b935329](https://github.com/smmariquit/room-tba/commit/b93532994827d0f2c26809c8a86387205d142096))

# [1.2.0](https://github.com/smmariquit/room-tba/compare/v1.1.0...v1.2.0) (2026-04-18)

### Bug Fixes

- update changelog ([4f54450](https://github.com/smmariquit/room-tba/commit/4f544506bccb81b4442372a166d312f08e75333f))
- update suggestion for trending searches ([b1eeaa1](https://github.com/smmariquit/room-tba/commit/b1eeaa1dbb382a5f93045030384a94031afb1564))

### Features

- add changelog.md to /changelog route ([5bbb4e2](https://github.com/smmariquit/room-tba/commit/5bbb4e2afcd3a47af625af5ad753507cb1ae58c8))
- add close button to the modal when schedule is open ([8221c2b](https://github.com/smmariquit/room-tba/commit/8221c2b77a04bb2b149eb4649af2faffa17b117c))
- add more suggestions to trending searches ([5cb42d3](https://github.com/smmariquit/room-tba/commit/5cb42d30fa3500fa55daad52b7ccd18b2629007c))
- add reactive icons if the location is centered ([407a16f](https://github.com/smmariquit/room-tba/commit/407a16fea19edee596c33d406c325682fa9d8864))
- update icons with lucide-icons ([5d841b0](https://github.com/smmariquit/room-tba/commit/5d841b02af4a9e489d165a874ef9ecda5519d928))
- update icons with lucide-icons ([3a9ed78](https://github.com/smmariquit/room-tba/commit/3a9ed78917fb89a3f8bc3eb9425f6be0dd862e67))

# [1.1.0](https://github.com/smmariquit/room-tba/compare/v1.0.1...v1.1.0) (2026-04-15)

### Features

- add vercel analytics ([20aab87](https://github.com/smmariquit/room-tba/commit/20aab87545aa0afe5d622e2fff68b648d45f3b9b))

## [1.0.1](https://github.com/smmariquit/room-tba/compare/v1.0.0...v1.0.1) (2026-04-14)

### Bug Fixes

- reloadPrompt unable to show reload button ([5d7ee5d](https://github.com/smmariquit/room-tba/commit/5d7ee5da195ed1e0daf97826f2522b1a7fd82c22))

# 1.0.0 (2026-04-14)

### Bug Fixes

- add scrolling for classQuery component ([a5e5823](https://github.com/smmariquit/room-tba/commit/a5e58233f23e943465647fda83d63c72254402f5))
- added css styling to no directions on room modal ([afcd5cc](https://github.com/smmariquit/room-tba/commit/afcd5cc4ccba3c39033c0722823d2405ced684d2))
- change logic for visibility of suggestions when searching ([ab58f4a](https://github.com/smmariquit/room-tba/commit/ab58f4ade867801e5ecb7eef28822dc2b2a9407d))
- fix image path for contributors/devs based on public/ structure ([c2e04f8](https://github.com/smmariquit/room-tba/commit/c2e04f859d530577072e87a5255ec6544068fcb2))
- fix removed settype ([b90da9d](https://github.com/smmariquit/room-tba/commit/b90da9df05d49630e31a957ec6b26af3ae9bf5fa))
- move filter below search and add padding at mobile to hero-header ([e3ac095](https://github.com/smmariquit/room-tba/commit/e3ac095ddc58cb7f9b224c18e49bfc043cc4241c))
- replace transparency on hover to outline on hover on filter button on entry ([c8dfaef](https://github.com/smmariquit/room-tba/commit/c8dfaef00d4061bb8d3c330335af4f46a13210b2))
- reset filter and close modals on new search query ([32fa6ee](https://github.com/smmariquit/room-tba/commit/32fa6eee68b7f6d1fb253faafb417c3fed2cc01e))
- update font-family ([5ca632e](https://github.com/smmariquit/room-tba/commit/5ca632e0aea920b11d9767d729cc41728d511699))
- update results not showing in suggestion event ([fcef254](https://github.com/smmariquit/room-tba/commit/fcef254c853ca6f3810f479abb3c55b34355b07f))
- updateQuery refactor to change behavior for searching ([1e6085c](https://github.com/smmariquit/room-tba/commit/1e6085c987c81a2d6deea98f4e067ae7f347676b))

### Features

- add 3d map and markers per building ([88f4a5f](https://github.com/smmariquit/room-tba/commit/88f4a5fe293885e86ad39ecee5f63dd48ab162f2))
- add changelog route ([d3190ba](https://github.com/smmariquit/room-tba/commit/d3190ba3a20e7f70729a66f6c1ae25b78c095ada))
- add CollegeResult and DivisionResult components ([f1e52ac](https://github.com/smmariquit/room-tba/commit/f1e52ac759e2b2aea3441a99c5501ffcddfc65bf))
- add conditional render to prompt users to open google form to contribute to room-tba if there is no direction data for a room/building ([291c352](https://github.com/smmariquit/room-tba/commit/291c3521708ff3138bc955e489c6e5b86ed40861))
- add directions/routing to buildings via maplibregldirections api ([2a62bf7](https://github.com/smmariquit/room-tba/commit/2a62bf745cb59faf7a1b84dae38059ac0b9a6c18))
- add functionalities to map: ([7c3eace](https://github.com/smmariquit/room-tba/commit/7c3eace030d0652d16f351ef2a8ed0d0e47efa25))
- add icons to suggestions ([e61af54](https://github.com/smmariquit/room-tba/commit/e61af54c7b65c62924ee1520cd7ac115718a5d01))
- add map rotation on room/building ([5a39a09](https://github.com/smmariquit/room-tba/commit/5a39a098f3599f0dec6818cbdcc26022054a956f))
- add maroon colors to hero ([48907f2](https://github.com/smmariquit/room-tba/commit/48907f2a8f9eac4ef8271e96c842c262bacf8165))
- add maxBounds to restrict number of tiles ([cfc8467](https://github.com/smmariquit/room-tba/commit/cfc84675a333b397ca1423f4f538f48077beec0a))
- add sorting based on number of classes in that room in descending order ([f1dd827](https://github.com/smmariquit/room-tba/commit/f1dd8275d1c8e178e07b6924a93f7e9faf1e8d36))
- add zoom in when room is selected and add function to determine if active marker ([98ee497](https://github.com/smmariquit/room-tba/commit/98ee4976d4b423a457142609ccec2f4cbee5e7f9))
- add zoom out when query is cleared ([f48e395](https://github.com/smmariquit/room-tba/commit/f48e3954b45c90832bde5a55bfe82727f9c4ad1b))
- calibrated all building data ([4d34090](https://github.com/smmariquit/room-tba/commit/4d34090838ca28e94356736f63118edc15646ef8))
- **ci:** add semantic-release and wire UI version to package.json ([6ae9912](https://github.com/smmariquit/room-tba/commit/6ae9912c86c584fdad393102075e65bc794ef294))
- copy over code to classquery to visually align with other sidepanel components ([2aa1b92](https://github.com/smmariquit/room-tba/commit/2aa1b92ae4724222d4d1fc26356df4f3529ef473))
- edit RoomDisplay para onclick set query to that room ([0011955](https://github.com/smmariquit/room-tba/commit/001195593d4dd0c08725e4c54c9b4e96e257252c))
- edit the header section to be more like a hero section ([d423ebb](https://github.com/smmariquit/room-tba/commit/d423ebbc43917e79ce46abdc780aa55ed02c7e4f))
- esc button closes sidepanel and clears query + directions ([45f764d](https://github.com/smmariquit/room-tba/commit/45f764dbfdabc6e134659400eaaefc8cc79a1a82))
- improve adding history logic to queryHistory ([f9de00b](https://github.com/smmariquit/room-tba/commit/f9de00b0f1ab799af0a6d4a4a478727c8b0fea7c))
- initial release ([df8cb2f](https://github.com/smmariquit/room-tba/commit/df8cb2fbe8464391dbc9dc70f60027633be2909f))
- make the label visible when a certain zoom level is met ([b9d8bae](https://github.com/smmariquit/room-tba/commit/b9d8bae283effb35818076bf3041523cfc3478b8))
- migrate RoomModalContent to RoomResult component ([d0dacad](https://github.com/smmariquit/room-tba/commit/d0dacadf9147467b09a335bd97c768d408527dfb))
- readded room directions ([6de7230](https://github.com/smmariquit/room-tba/commit/6de7230ae2395888fd4395c3e5a11cf01f4155f4))
- reopen landingmodal on contributors in statusbar ([f981fdb](https://github.com/smmariquit/room-tba/commit/f981fdb71c5848148649ce92019aff2cc73053b8))
- **statusbar:** make status bar collapsible on mobile ([337c950](https://github.com/smmariquit/room-tba/commit/337c95092a0b43ca79c0abcc82356919e2a9fce2))
- update pitch when centering location ([21fb023](https://github.com/smmariquit/room-tba/commit/21fb023467a2cf8c74889c319060a58ed7afe56f))
- update Suggestion component visibility ([d685515](https://github.com/smmariquit/room-tba/commit/d6855155b48c1e1b2157fe281f856b3d23fce8f4))

### Performance Improvements

- limit routing to one request only on initial get directions ([5da0d90](https://github.com/smmariquit/room-tba/commit/5da0d90643f0472a9d6e412f0b820cf3dba7190c))
- removed infinite loop by untracking flyto in map ([c527b3f](https://github.com/smmariquit/room-tba/commit/c527b3fa16346842393f5ce4f12f72cd1dc07a82))
