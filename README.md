## Description

Cache Invalidation at model level extended features for [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) (v2.1.0)

## Installation

```bash
$ npm install base-repo sequelize@6.6.2 sequelize-typescript@2.1.0
```

Your `tsconfig.json` needs the following flags:

```json
"target": "es6", // or a more recent ecmascript version
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

## Module Definition

make sure defined all model of sequelize at this level
and

```typescript
@Module({
  ...
  imports: [
    RedisModule.register(cacheConfig() as RedisModuleOptions),

    RepositoryModule.forRoot({
      defaultTTL: 1000, // DEFINE TTL FOR ALL PROJECT
      callbackGet: async ({ key }) => {
        return AppModule.redisService.getClient().get(key) // DEFINE HOW TO GET CACHE FROM GIVEN KEY
      },
      callbackInvalidate: ({ key }) => { //
        return AppModule.redisService.getClient().del(key) // DEFINE HOW TO INVALIDATE CACHE FROM GIVEN KEY
      },
      callbackSet: async ({ key, value, ttl }) => {
        return AppModule.redisService.getClient().set(key, value, 'EX', ttl) // DEFINE HOW TO SET CACHE FROM GIVEN KEY VALUE AND TTL
      }
      callbackGetKey: async ({ keyPattern }) => {
        return AppModule.redisService.getClient().keys(keyPattern); // TO FIND KEYS BY PATTERN
      },
    }),

    SequelizeModule.forRoot({
      ...DBOptions,
    }),
   ...
  ],
})

export class AppModule {
  static redisService: RedisService

  constructor(redisService: RedisService) {
    AppModule.redisService = redisService // DEFINE CACHE SERVICE THAT CAN CALLED AT REPOSITORY DEFINITION

  }
}
```

## Model Definition

### `@Cache(options)`

the @Cache is used for defined ttl and cache for findOne and automatically invalidate findOneCache/findByPkCache

#### `@Cache` API Options

| Options       | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `options.ttl` | set TTL for this model, this will override ttl at module (Optional) |

```typescript
@Cache({
  ttl: 100,
})
@Table()
export class DmCourse extends BaseModel {}
```

### Extend `BaseModel`

```ts
@Cache({
  ttl: 100,
})
@Table()
export class DmCourse extends BaseModel {
  // default `{modelName} data not found'
  static notFoundMessage = 'your model not found message';
}
```

the Model need to extends `BaseModel`

### More Strict

```ts
interface DmCourseAtt {
  id: number
  name: string;
  type: number;
}

interface DmCreateAtt extends DmCourseAtt Omit<DmCourseAtt, 'id'>

@Cache({
  ttl: 100,
})
@Table()
export class DmCourse extends BaseModel<DmCourseAtt, DmCreateAtt> {}
```

for strict type that can used at default function from sequelize-typescript can be planted at generic type 2 and 3 [sequelize-typescript strict](https://github.com/RobinBuschmann/sequelize-typescript#more-strict)

## How to use

### `Model.findOneCache(cacheOptions)`

- `cacheOptions : FindOptions` limited findOptions from sequelize-typescript

```ts
// file: DmCourse.ts

@Cache() //default ttl module
@Table()
export class DmCourse extends BaseModel<DmCourseAtt, DmCreateAtt> {}

...

// file: Course.controller.ts

class CourseController {
  async getCourse() {
    const course = await DmCourse.findOneCache({
      where: {
        isDeleted: false,
        name: 'Math',
      },
      rejectOnEmpty: true, // use model default throw, or use use throw Exception
      // rejectOnEmpty: new BadRequestException('message')
    })
  }
}
```

- you have to use All defined cache attributes that has name `byIsDeletedAndName`
- every query that outside of defined cache will not executed

#### `findOneCache` API Options

| Options                      | Description                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cacheOptions`               | some function from `Sequelize FindOptions`                                                                               |
| `cacheOptions.ttl`           | set TTL for this cache key, this will override ttl at module and model `(Optional)`, `(Required)` when has include Query |
| `cacheOptions.rejectOnEmpty` | will throw error when set `true` (Optional)                                                                              |

### `Model.findByPkCache(id, options)`

```ts
class CourseController {
  async getCourse() {
    const course = await DmCourse.findByPkCache(1, {
      ttl: 100,
    });
  }
}
```

- find By Primary Cache will invalidate when any destroy or update

#### `findByPkCache` API Options

| Options                      | Description                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`                         | value of id                                                                                                              |
| `cacheOptions`               | some function from `Sequelize FindOptions`                                                                               |
| `cacheOptions.ttl`           | set TTL for this cache key, this will override ttl at module and model `(Optional)`, `(Required)` when has include Query |
| `cacheOptions.rejectOnEmpty` | will throw error when set `true` (Optional)                                                                              |

### `Model.findAllCache(cacheOptions)`

```ts
class CourseController {
  async getCourse() {
    const course = await DmCourse.findAllCache({
     ttl: 100,
     attributes: ['id','name','type']
     where: {
       isDeleted: false,
     },
     order: [
       ['id','desc']
     ],
     include: [
       {
         // any association
       }
     ],
     limit: 10,
    })
  }
}
```

- find all data and Cache it when has value. will invalidate and update cache when ttl reach 0 or when get max updates or count is different from before

#### `findAllCache` API Options

| Options             | Description                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `cacheOptions.ttl`  | set TTL for this cache key, this will override ttl at module and model (Optional) |
| `{...cacheOptions}` | is same with FindOptions from sequelize-typescript                                |

## Stay in touch

- Author - [Fauzi Fadhillah](https://github.com/FauziFadhi)
- [Email](fauzifadhi@gmail.com)
