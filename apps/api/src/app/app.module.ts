import {Module} from '@nestjs/common';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {ParentItemsModule} from "../parent-items/parent-items.module";

@Module({
  imports: [
    ParentItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {
}
