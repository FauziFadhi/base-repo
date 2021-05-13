## Description

Cache Invalidation at model level extended features for [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) (v2.1.0)

## Installation

```bash
$ npm install base-repo@beta sequelize@>6.6.2 sequelize-typescript@2.1.0
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

the @Cache is used for defined ttl and cache for findOne

#### `@Cache` API Options

| Options                                                 | Description                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `options.ttl`                                           | set TTL for this model, this will override ttl at module (Optional)            |
| `options.caches`                                        | this is for set cache for find One                                             |
| `options.caches[keyName] : string`                      | this is the name for cache that will be used when use [Model.findOneCache](##) |
| `options.caches[keyName][attributes]: string[]`         | this is for defining attributes that will be mapped at whereOptions            |
| `options.caches[keyName][group] ?: string[]`            | this is for defining group query                                               |
| `options.caches[keyName][havingAttributes] ?: string[]` | this is for defining having query                                              |
| `options.caches[keyName][order] ?: string[]`            | this is for defining order query                                               |

```typescript
const caches = {
  byIsDeletedAndName: {
    attributes: ['isDeleted', 'name'],
    order: ['id', 'name'],
  },
  byType: {
    attributes: ['type'],
  },
} as const; // as  const is required, this for attributes recommend when using it;
@Cache({
  caches: caches,
  ttl: 100,
})
@Table()
export class DmCourse extends BaseModel<typeof caches> {}
```

### Extend `BaseModel`

```ts
@Cache({
  caches: caches,
  ttl: 100,
})
@Table()
export class DmCourse extends BaseModel<typeof caches> {}
```

the Model need to extends `BaseModel` with first generic type is typeof `caches` that we define for cache

### More Strict

```ts
interface DmCourseAtt {
  id: number
  name: string;
  type: number;
}

interface DmCreateAtt extends DmCourseAtt Omit<DmCourseAtt, 'id'>

@Cache({
  caches: caches,
  ttl: 100,
})
@Table()
export class DmCourse extends BaseModel<typeof caches, DmCourseAtt, DmCreateAtt> {}
```

for strict type that can used at default function from sequelize-typescript can be planted at generic type 2 and 3 [sequelize-typescript strict](https://github.com/RobinBuschmann/sequelize-typescript#more-strict)

## How to use

### `Model.findOneCache(cacheName, cacheOptions)`

- `cacheName : string`
- `cacheOptions : FindOptions` limited findOptions from sequelize-typescript

```ts
// file: DmCourse.ts
const caches = {
  byIsDeletedAndName: {
    attributes: ['isDeleted', 'name'],
    order: ['id', 'name'],
  }
} as const

@Cache({
  caches: caches,
})
@Table()
export class DmCourse extends BaseModel<typeof caches, DmCourseAtt, DmCreateAtt> {}

...

// file: Course.controller.ts

class CourseController {
  async getCourse() {
    const course = await DmCourse.findOneCache('byIsDeletedAndName', {
      where: {
        isDeleted: false,
        name: 'Math',
        order: [
          ['id', 'desc'],
          ['name', 'asc']
        ]
      }
    })
  }
}
```

- you have to use All defined cache attributes that has name `byIsDeletedAndName`
- every query that outside of defined cache will not executed

#### `findOneCache` API Options

| Options                | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| `cacheName`            | name that defined at model                                                        |
| `cacheOptions.ttl`     | set TTL for this cache key, this will override ttl at module and model (Optional) |
| `cacheOptions.isThrow` | will throw error when set `true` (Optional)                                       |
| `cacheOptions.where`   | limited where from `FindOptions` sequelize-typescript                             |
| `cacheOptions.group`   | limited group from `FindOptions` sequelize-typescript (Optional)                  |
| `cacheOptions.having`  | limited having from `FindOptions` sequelize-typescript (Optional)                 |
| `cacheOptions.order`   | limited order from `FindOptions` sequelize-typescript (Optional)                  |

### `Model.findByPkCache(id, options)`

```ts
class CourseController {
  async getCourse() {
    const course = await DmCourse.findByPkCache(1, {
      ttl: 100,
      isThrow: true,
    });
  }
}
```

- find By Primary Cache will invalidate when any destroy or update

#### `findByPkCache` API Options

| Options                | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| `id`                   | value of id                                                                       |
| `cacheOptions.ttl`     | set TTL for this cache key, this will override ttl at module and model (Optional) |
| `cacheOptions.isThrow` | will throw error when set `true`                                                  |

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
